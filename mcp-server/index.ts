#!/usr/bin/env node
import * as readline from "readline";
import * as crypto from "crypto";

// Configuration
const BASE_URL = process.env.AGENTHELM_BASE_URL || "https://agenthelm.online";
const CONNECT_KEY = process.env.AGENTHELM_CONNECT_KEY;
const PROJECT = process.env.AGENTHELM_PROJECT;
// Agent name for identification - can be "Claude", "Codex", or custom
const AGENT_NAME = process.env.AGENTHELM_AGENT_NAME || "MCP Agent";

let activeToken: string | null = null;
let agentId: string | null = null;

function logDebug(msg: string) {
  // We cannot log to stdout because it is used for JSON-RPC. We log to stderr.
  process.stderr.write(`[DEBUG] ${msg}\n`);
}

// Check configuration
if (!CONNECT_KEY) {
  logDebug("WARNING: AGENTHELM_CONNECT_KEY is not set.");
}
if (!PROJECT) {
  logDebug("WARNING: AGENTHELM_PROJECT is not set.");
}

async function ensureHandshake() {
  if (activeToken) return;

  if (!CONNECT_KEY) {
    throw new Error("AGENTHELM_CONNECT_KEY is not configured.");
  }

  logDebug("Starting AgentHelm handshake...");
  const response = await fetch(`${BASE_URL}/api/sdk/ping`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      key: CONNECT_KEY,
      name: AGENT_NAME,
      agent_type: "node",
      version: "1.0.0",
      status: "idle",
      project: PROJECT
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Handshake failed (status ${response.status}): ${errText}`);
  }

  const data = await response.json();
  activeToken = data.agent_token;
  agentId = data.agent_id;
  logDebug(`Handshake successful: registered agent ID ${agentId}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    if (request.jsonrpc !== "2.0") return;

    // Handle JSON-RPC Notifications (no id, no response expected)
    if (request.id === undefined) {
      logDebug(`Received notification: ${request.method}`);
      return;
    }

    const response = await handleRequest(request);
    process.stdout.write(JSON.stringify(response) + "\n");
  } catch (err) {
    logDebug(`Error parsing/processing line: ${err}`);
  }
});

async function handleRequest(req: any): Promise<any> {
  const { id, method, params } = req;
  
  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "agenthelm-mcp",
          version: "1.0.0"
        }
      }
    };
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "get_context",
            description: "Retrieves relevant, ranked context from the Project Brain using semantic context selection. Useful when starting a task, resolving design questions, or looking up project standards.",
            inputSchema: {
              type: "object",
              properties: {
                task_hint: {
                  type: "string",
                  description: "A hint or description of the current task to rank relevance (e.g. 'database migration', 'auth cookies')."
                }
              }
            }
          },
          {
            name: "propose_knowledge",
            description: "Submits a Knowledge Proposal containing newly discovered or updated project design, decisions, schema changes, or API specifications. The proposal enters a validation queue before being compiled into the Project Brain.",
            inputSchema: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "A concise summary explaining what was decided, changed, or discovered."
                },
                decisions: {
                  type: "array",
                  items: { "type": "string" },
                  description: "A list of concrete engineering decisions made."
                },
                files_modified: {
                  type: "array",
                  items: { "type": "string" },
                  description: "A list of file paths that were modified."
                },
                apis_affected: {
                  type: "array",
                  items: { "type": "object" },
                  description: "Details of any API changes made (e.g., endpoints, methods)."
                },
                db_changes: {
                  type: "array",
                  items: { "type": "object" },
                  description: "Details of any database schema or table changes made."
                },
                architecture: {
                  type: "array",
                  items: { "type": "object" },
                  description: "Architecture findings, patterns, component diagrams, or system design decisions."
                },
                tests_passed: {
                  type: "boolean",
                  description: "Whether all local tests passed successfully."
                }
              },
              required: ["summary"]
            }
          },
          {
            name: "get_history",
            description: "Retrieves version history, diffs, blame, or show details for the Project Brain. Allows reviewing exactly who proposed what, what files changed, what conflicts occurred, and when.",
            inputSchema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  enum: ["log", "show", "diff", "blame"],
                  description: "The history action to perform."
                },
                version: {
                  type: "integer",
                  description: "The specific version number (required for 'show')."
                },
                version_a: {
                  type: "integer",
                  description: "The first version number (required for 'diff')."
                },
                version_b: {
                  type: "integer",
                  description: "The second version number (required for 'diff')."
                },
                category: {
                  type: "string",
                  description: "The entry category (required for 'blame')."
                },
                title: {
                  type: "string",
                  description: "The entry title (required for 'blame')."
                }
              },
              required: ["action"]
            }
          },
          {
            name: "resume_task",
            description: "Resumes a previous agent session by retrieving the last completed checkpoint for a given task_id. Returns the state snapshot, step name, and output data to continue where the previous session left off.",
            inputSchema: {
              type: "object",
              properties: {
                task_id: {
                  type: "string",
                  description: "The task ID to resume from (returned from a previous session)."
                }
              },
              required: ["task_id"]
            }
          },
          {
            name: "list_tasks",
            description: "Lists available tasks/checkpoints for the current project. Returns tasks with their latest checkpoint info so a fresh session can pick up where it left off.",
            inputSchema: {
              type: "object",
              properties: {}
            }
          },
          {
            name: "record_incident",
            description: "Records an incident/debugging finding to prevent duplicate work. Stores root cause, solution, and context so future sessions (or other agents) can retrieve it instead of re-debugging.",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Brief title of the incident (e.g., 'Auth cookie not sent in Safari')"
                },
                root_cause: {
                  type: "string",
                  description: "What actually caused the issue"
                },
                solution: {
                  type: "string",
                  description: "How the issue was fixed"
                },
                context: {
                  type: "string",
                  description: "Additional context (error messages, stack traces, environment details)"
                },
                tags: {
                  type: "array",
                  items: { "type": "string" },
                  description: "Searchable tags for retrieval (e.g., ['auth', 'cookie', 'safari'])"
                }
              },
              required: ["title", "root_cause", "solution"]
            }
          },
          {
            name: "get_incident",
            description: "Retrieves a previously recorded incident by title or tags. Use this to check if a similar issue has been debugged before starting work.",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Exact title to search for"
                },
                tags: {
                  type: "array",
                  items: { "type": "string" },
                  description: "Tags to filter incidents by"
                }
              }
            }
          }
        ]
      }
    };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params || {};
    if (!CONNECT_KEY || !PROJECT) {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: "Error: MCP Server is not configured. Please set the AGENTHELM_CONNECT_KEY and AGENTHELM_PROJECT environment variables."
            }
          ],
          isError: true
        }
      };
    }

    try {
      await ensureHandshake();
    } catch (err: any) {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `Handshake failed: ${err.message || String(err)}`
            }
          ],
          isError: true
        }
      };
    }

    if (name === "get_context") {
      return await handleGetContext(id, args);
    } else if (name === "propose_knowledge") {
      return await handleProposeKnowledge(id, args);
    } else if (name === "get_history") {
      return await handleGetHistory(id, args);
    } else if (name === "resume_task") {
      return await handleResumeTask(id, args);
    } else if (name === "list_tasks") {
      return await handleListTasks(id, args);
    } else if (name === "record_incident") {
      return await handleRecordIncident(id, args);
    } else if (name === "get_incident") {
      return await handleGetIncident(id, args);
    } else {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Tool not found: ${name}`
        }
      };
    }
  }

  // Fallback for unsupported methods
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`
    }
  };
}

async function handleGetContext(id: any, args: any): Promise<any> {
  const { task_hint } = args || {};
  try {
    const response = await fetch(`${BASE_URL}/api/sdk/inject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        project: PROJECT,
        task_hint: task_hint || "",
        max_context_tokens: 4000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `API Error (status ${response.status}): ${errText || response.statusText}`
            }
          ],
          isError: true
        }
      };
    }

    const data = await response.json();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ],
        isError: false
      }
    };
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Connection failed: ${err.message || String(err)}`
          }
        ],
        isError: true
      }
    };
  }
}

async function handleProposeKnowledge(id: any, args: any): Promise<any> {
  const { summary, decisions, files_modified, apis_affected, db_changes, architecture, tests_passed } = args || {};
  
  if (!summary) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: "Error: summary parameter is required."
          }
        ],
        isError: true
      }
    };
  }

  try {
    // Generate content hash deterministically
    const payload = {
      summary,
      decisions: decisions || [],
      files_modified: files_modified || [],
      apis_affected: apis_affected || [],
      db_changes: db_changes || [],
      architecture: architecture || [],
      tests_passed: !!tests_passed,
      author: "mcp-agent"
    };

    const contentHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const response = await fetch(`${BASE_URL}/api/sdk/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        project: PROJECT,
        agent_id: agentId,
        content_hash: contentHash,
        payload
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `API Error (status ${response.status}): ${errText || response.statusText}`
            }
          ],
          isError: true
        }
      };
    }

    const data = await response.json();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ],
        isError: false
      }
    };
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Connection failed: ${err.message || String(err)}`
          }
        ],
        isError: true
      }
    };
  }
}

async function handleResumeTask(id: any, args: any): Promise<any> {
  const { task_id } = args || {};

  if (!task_id) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: "Error: task_id parameter is required."
          }
        ],
        isError: true
      }
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/sdk/checkpoint?key=${CONNECT_KEY}&task_id=${encodeURIComponent(task_id)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${activeToken}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `API Error (status ${response.status}): ${errText || response.statusText}`
            }
          ],
          isError: true
        }
      };
    }

    const data = await response.json();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ],
        isError: false
      }
    };
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Connection failed: ${err.message || String(err)}`
          }
        ],
        isError: true
      }
    };
  }
}

async function handleListTasks(id: any, args: any): Promise<any> {
  try {
    const projectParam = PROJECT || "";
    const response = await fetch(`${BASE_URL}/api/sdk/tasks?key=${CONNECT_KEY}&project=${encodeURIComponent(projectParam)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${activeToken}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `API Error (status ${response.status}): ${errText || response.statusText}`
            }
          ],
          isError: true
        }
      };
    }

    const data = await response.json();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ],
        isError: false
      }
    };
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Connection failed: ${err.message || String(err)}`
          }
        ],
        isError: true
      }
    };
  }
}

async function handleRecordIncident(id: any, args: any): Promise<any> {
  const { title, root_cause, solution, context, tags } = args || {};

  if (!title || !root_cause || !solution) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: "Error: title, root_cause, and solution parameters are required."
          }
        ],
        isError: true
      }
    };
  }

  try {
    // Use propose_knowledge to store incident as a special proposal
    const payload = {
      summary: `[INCIDENT] ${title}`,
      decisions: [{
        title: "Incident Root Cause",
        description: root_cause,
        type: "incident"
      }, {
        title: "Incident Solution",
        description: solution,
        type: "incident"
      }],
      files_modified: [],
      apis_affected: [],
      db_changes: [],
      architecture: [],
      tests_passed: true,
      author: "mcp-agent"
    };

    const contentHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");

    const response = await fetch(`${BASE_URL}/api/sdk/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        project: PROJECT,
        agent_id: agentId,
        content_hash: contentHash,
        payload
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `API Error (status ${response.status}): ${errText || response.statusText}`
            }
          ],
          isError: true
        }
      };
    }

    const data = await response.json();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ...data, message: "Incident recorded successfully" }, null, 2)
          }
        ],
        isError: false
      }
    };
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Connection failed: ${err.message || String(err)}`
          }
        ],
        isError: true
      }
    };
  }
}

async function handleGetIncident(id: any, args: any): Promise<any> {
  const { title, tags } = args || {};

  try {
    // Search for incidents via history API with blame action or custom search
    // For now, use get_history with a search approach
    const response = await fetch(`${BASE_URL}/api/sdk/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        key: CONNECT_KEY,
        project: PROJECT,
        action: "log"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `API Error (status ${response.status}): ${errText || response.statusText}`
            }
          ],
          isError: true
        }
      };
    }

    const data = await response.json();
    // Filter for incidents in the response
    const incidents = (data.entries || []).filter((entry: any) =>
      entry.title && entry.title.startsWith("[INCIDENT]") &&
      (title ? entry.title.includes(title) : true) &&
      (tags && tags.length > 0 ? tags.some((t: string) =>
        JSON.stringify(entry.content).toLowerCase().includes(t.toLowerCase())
      ) : true)
    );

    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify({ incidents, count: incidents.length }, null, 2)
          }
        ],
        isError: false
      }
    };
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Connection failed: ${err.message || String(err)}`
          }
        ],
        isError: true
      }
    };
  }
}

async function handleGetHistory(id: any, args: any): Promise<any> {
  const { action, version, version_a, version_b, category, title } = args || {};
  try {
    const response = await fetch(`${BASE_URL}/api/sdk/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${activeToken}`
      },
      body: JSON.stringify({
        key: CONNECT_KEY,
        project: PROJECT,
        action,
        version,
        version_a,
        version_b,
        category,
        title
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: `API Error (status ${response.status}): ${errText || response.statusText}`
            }
          ],
          isError: true
        }
      };
    }

    const data = await response.json();
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2)
          }
        ],
        isError: false
      }
    };
  } catch (err: any) {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: `Connection failed: ${err.message || String(err)}`
          }
        ],
        isError: true
      }
    };
  }
}

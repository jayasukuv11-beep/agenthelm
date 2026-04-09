import warnings
from typing import Optional, Dict, Any

OTEL_AVAILABLE = False
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.resources import Resource
    OTEL_AVAILABLE = True
except ImportError:
    pass

class OTELExporter:
    def __init__(self, endpoint: Optional[str], agent_name: str, version: str):
        self.tracer = None
        self._enabled = False

        if not OTEL_AVAILABLE:
            warnings.warn(
                "OpenTelemetry trace modules not installed. Run: pip install opentelemetry-api opentelemetry-sdk opentelemetry-exporter-otlp\n"
                "OTEL export disabled — AgentHelm will continue logging normally.",
                UserWarning,
                stacklevel=2
            )
            return

        try:
            from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
            # Setup tracer with standard gen_ai attributes
            resource = Resource.create({
                "service.name": agent_name,
                "service.version": version,
                "telemetry.sdk.name": "agenthelm",
                "telemetry.sdk.language": "python"
            })
            
            provider = TracerProvider(resource=resource)
            # Send traces to the configured endpoint (or default local if none specified)
            exporter_kwargs = {}
            if endpoint:
                exporter_kwargs["endpoint"] = endpoint
            
            exporter = OTLPSpanExporter(**exporter_kwargs)
            processor = BatchSpanProcessor(exporter)
            provider.add_span_processor(processor)
            trace.set_tracer_provider(provider)
            
            self.tracer = trace.get_tracer("agenthelm.sdk")
            self._enabled = True
        except Exception as e:
            warnings.warn(
                f"Failed to initialize OpenTelemetry: {e}\n"
                "OTEL export disabled — AgentHelm will continue logging normally.",
                UserWarning,
                stacklevel=2
            )

    def start_span(self, name: str, attributes: Optional[Dict[str, Any]] = None):
        """Starts a span and returns the span object. Caller must end it."""
        if not self._enabled or not self.tracer:
            return None
            
        span = self.tracer.start_span(name)
        if attributes:
            span.set_attributes(attributes)
        return span

    def end_span(self, span, error: Optional[Exception] = None):
        """Ends the span, cleanly handling exceptions if provided."""
        if not span:
            return
            
        if error is not None:
            span.record_exception(error)
            # Depending on OTEL version, we should set status to ERROR, 
            # but string import may vary so we just record exception for now.
        span.end()

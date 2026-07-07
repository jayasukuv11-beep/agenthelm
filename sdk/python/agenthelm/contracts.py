from .proposals import ProposalPublisher


class ContractPublisher(ProposalPublisher):
    """
    Backwards-compatible alias for Knowledge Proposals.

    Context Contracts were renamed because agents should not publish truth
    directly into the Project Brain. They now publish proposals that the Brain
    Compiler can validate, merge, reject, or route for human review.
    """

    def publish(self, *args, confidence=None, human_reviewed=None, **kwargs) -> str:
        if confidence is not None:
            self.client.warn("contract confidence is deprecated; proposal evidence is calculated server-side.")
        if human_reviewed is not None:
            self.client.warn("human_reviewed is ignored; reviewers approve proposals through AgentHelm.")
        return super().publish(*args, **kwargs)

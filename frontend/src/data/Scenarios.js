export const SCENARIOS = [
    {
        id: "high",
        name: "High Risk Simulation",
        riskLevel: "High",
        description: "Fast-moving and volatile market conditions",
        updateIntervalMs: 3000,
    },
    {
        id: "medium",
        name: "Medium Risk Simulation",
        riskLevel: "Medium",
        description: "Moderate volatility with balanced movement",
        updateIntervalMs: 7000,
    },
    {
        id: "low",
        name: "Low Risk Simulation",
        riskLevel: "Low",
        description: "More stable market conditions with slower changes",
        updateIntervalMs: 12000,
    },
    {
        id: "minimal",
        name: "Minimal Risk Simulation",
        riskLevel: "Minimal",
        description: "Very slow and predictable updates intended for cautious trading behaviour",
        updateIntervalMs: 20000,
    },
]
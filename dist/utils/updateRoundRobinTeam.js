export function updateRoundRobinTeam(team = [], memberId) {
    const index = team.findIndex(m => m.memberId.toString() === memberId);
    team[index] = {
        priority: team[team.length - 1].priority,
        memberId: team[index].memberId,
    };
    team = team
        .map((member, i, arr) => {
        if (member.memberId.toString() === memberId) {
            return {
                priority: member.priority,
                memberId: member.memberId,
            };
        }
        return {
            priority: index < i ? member.priority - 1 : member.priority,
            memberId: member.memberId,
        };
    })
        .sort((a, b) => a.priority - b.priority);
    return team;
}
//# sourceMappingURL=updateRoundRobinTeam.js.map
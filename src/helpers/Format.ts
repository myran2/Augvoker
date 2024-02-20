export function secondsToTime(seconds: number, minuteDigits: number = 2): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(minuteDigits, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function timeToSeconds(time: string): number {
    if (time.includes('_')) {
        return 0;
    }

    if (time === "PULL") {
        return 0;
    }
    
    const parts = time.split(':');
    const min = parseInt(parts[0]);
    const sec = parseInt(parts[1]);

    return (60 * min) + sec;
}

export function formatThousands(number: number): string {
    // If env variable LOCALE is set, use that locale for formatting.
    return Math.round(number || 0).toLocaleString("en");
}

export function formatDamageNumber(number: number): string {
    if (number > 1000000) {
        return `${(number / 1000000).toFixed(2)}m`;
    }
    if (number > 10000) {
        return `${Math.round(number / 1000)}k`;
    }
    return formatThousands(number);
}

export function getColor(playerClass: string): string {
    switch(playerClass.toLowerCase()) {
        case "deathknight":
            return "#C41E3A";
        case "demonhunter":
            return "#A330C9";
        case "druid":
            return "#FF7C0A";
        case "evoker":
            return "#33937F";
        case "hunter":
            return "#AAD372";
        case "mage":
            return "#3FC7EB";
        case "monk":
            return "#00FF98";
        case "paladin":
            return "#F48CBA";
        case "priest":
            return "#FFFFFF";
        case "rogue":
            return "#FFF468";
        case "shaman":
            return "#0070DD";
        case "warlock":
            return "#8788EE";
        case "warrior":
            return "#C69B6D";
        default:
            return "#FFFFFF";
    }
}

export function colorize(playerName: string, playerClass: string): string {
    let colorString = getColor(playerClass).substring(1);
    return `|cff${colorString.toLowerCase()}${playerName}|r`;
}
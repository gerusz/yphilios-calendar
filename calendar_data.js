//Calendar
export const dayNames = [
	"Siopoia",
	"Durgoia",
	"Ildaia",
	"Ómuria",
	"Abelaia",
	"Rautayrgoia",
	"Ur-Khaia"
];

export const monthNames = [
	"Psychros",
	"Laspoménos",
	"Anemódis",
	"Brocheros",
	"Zestos",
	"Ilióloustos",
	"Xiros",
	"Katáxiros",
	"Psychóntas",
	"Scoteinos",
	"Sevásmios",
	"Chionódis"
];

export const monthLengths = {
	"Psychros": [31],
	"Laspoménos": [31],
	"Anemódis": [31],
	"Brocheros": [31],
	"Zestos": [31],
	"Ilióloustos": [31],
	"Xiros": [31],
	"Katáxiros": [31],
	"Psychóntas": [31],
	"Scoteinos": [31],
	"Sevásmios": [31],
	"Chionódis": [
		32,
		31
	],
};

export const moons = {
	"Aspris": {
		"period": 7,
		"offset": 3,
		"color": "#FFFFFF"
	},
	"Aimas": {
		"period": 14,
		"offset": 3,
		"color": "#FF0000"
	}
}

export function getMonthLength(monthNameOrIndex, year=0) {
	let monthName = "";
	if(typeof monthNameOrIndex === "string") {
		monthName = monthNameOrIndex;
	} else {
		monthName = monthNames[monthNameOrIndex-1];
	}
	let monthLengthDef = monthLengths[monthName];
	let yearTypeIndex = year % monthLengthDef.length;
	return monthLengthDef[yearTypeIndex];
}

const yearOffset=0; // We won't really show anything from the calendar before 1622
const weekOffset = 3; // 1622 starts with a Siopoia.

export function getMoonPhase(moonName, dayIndex) {
	let moon = moons[moonName];
	return (dayIndex + moon.offset) % moon.period;
}

export function getMoonPhases(dayIndex) {
	return Object.fromEntries(
		Object.keys(moons).map((moonName) => [moonName, getMoonPhase(moonName, dayIndex)])
	);
}

const moonSymbols = {
	"full":  "&#x1F311;&#xFE0E;",
	"wangib": "&#x1F312;&#xFE0E;",
	"lquart":  "&#x1F313;&#xFE0E;",
	"wancres":  "&#x1F314;&#xFE0E;",
	"n_moon":    "&#x1F315;&#xFE0E;",
	"waxcres":  "&#x1F316;&#xFE0E;",
	"fquart":  "&#x1F317;&#xFE0E;",
	"waxgib": "&#x1F318;&#xFE0E;",
}

export function getMoonPhaseSymbol(moonPhase, moonPeriod) {
	// If the moon period is even, full and new moons will last 2 days.
	// If the moon period is odd, they will last one day, with the new moon
	// being the day before the actual midpoint
	let twoDayPhases = (moonPeriod % 2 == 0);

	let wanGib = Math.round(moonPeriod/8);
	let lastQuarter = Math.round(moonPeriod/4);
	let wanCres = Math.round(moonPeriod*(3/8));

	let newMoon1 = Math.floor(moonPeriod/2);
	let newMoon2 = newMoon1 + (twoDayPhases ? 1 : 0);

	let waxCres = Math.round(newMoon2 + moonPeriod/8);
	let firstQuarter = Math.round(newMoon2 + moonPeriod/4);

	let waxGib = Math.round(newMoon2 + moonPeriod * (3/8));

	let output = "";

	if(moonPhase == 0 || (twoDayPhases && moonPhase == moonPeriod)) {
		// Full moon
		output = moonSymbols.full;
	}
	else if(moonPhase <= wanGib) output = moonSymbols.wangib;
	else if(moonPhase <= lastQuarter) output = moonSymbols.lquart;
	else if(moonPhase <= wanCres || moonPhase < newMoon1) output = moonSymbols.wancres;
	else if(moonPhase == newMoon1 || moonPhase == newMoon2) output = moonSymbols.n_moon;
	else if(moonPhase <= waxCres) output = moonSymbols.waxcres;
	else if(moonPhase <= firstQuarter) output = moonSymbols.fquart;
	else if(moonPhase <= waxGib) output = moonSymbols.waxgib;
	else {
		output = moonSymbols.full;
	}
	// New Moon override is necessary for the short-period moon
	if(moonPhase == newMoon1 || moonPhase == newMoon2) output = moonSymbols.n_moon;
	return output;
}


export class YphiliosDate {
	constructor(year, month, day) {
		// Months and days are 1-indexed, bounded to possible values
		this.year = year;
		
		this.month = month % 12;
		if (this.month == 0) {
			this.month = 12;
		}
		this.monthName = monthNames[this.month-1];
		
		let monthLength = getMonthLength(this.monthName, year);
		this.day = day % monthLength;
		if (this.day == 0) {
			this.day = monthLength;
		}
		
		// Calculate the day of week
		let elapsedYears = (year - yearOffset);
		// On Yphilios even years are leap years. And so is 1622.
		// Thus, if elapsed years are odd, there's one more leap year than regular years.
		// If the elapsed years are even, there are an equal number of those elapsed.
		let elapsedRegularYears = Math.floor(elapsedYears/2);
		let elapsedLeapYears = elapsedRegularYears + (year % 2);
		
		let elapsedMonths = this.month - 1;
		this.dayOfYearIndex = 31 * elapsedMonths + this.day;
		this.dayIndex = 372*elapsedRegularYears + 373*elapsedLeapYears + this.dayOfYearIndex;
		this.weekDayIndex = (this.dayIndex + weekOffset - 1) % dayNames.length;
		this.weekDay = dayNames[this.weekDayIndex];
		
		// Add the moon phases
		this.moonPhases = getMoonPhases(this.dayIndex);
		
		// Week index
		let yearStartDay = getYearStartDay(year);
		this.weekIndex = Math.ceil((this.dayOfYearIndex + yearStartDay)/7);
	}
	
	get shortDateString() {
		return "" + this.year + "/" + this.month + "/" + this.day;
	}
	
	get longDateString() {
		return "" + this.year + " " + this.monthName + " " + this.day + ", " + this.weekDay;
	}
	
	moonPhasesString(asHtml = true) {
		let output = "";
		Object.keys(this.moonPhases).forEach((moonName) => {
			output += moonName + ": ";
			let moonPhaseSymbol = getMoonPhaseSymbol(this.moonPhases[moonName], moons[moonName].period);
			if(asHtml) {
				output += "<span style='color: " + moons[moonName].color + "'>";
			}
			output += moonPhaseSymbol;
			if(asHtml) {
				output += "</span><br/>";
			}
		});
		return output;
	}

	get moonPhaseData() {
		return Object.fromEntries(
			Object.entries(this.moonPhases).map(([moonName, moonPhase]) => [moonName, {
				"phase": moonPhase,
				"period": moons[moonName].period,
				"symbol": getMoonPhaseSymbol(moonPhase, moons[moonName].period),
				"color": moons[moonName].color
				}])
		);
	}

	equals(other) {
		return this.dayIndex == other.dayIndex;
	}

	sameWeek(other) {
		return (this.dayIndex - this.weekDayIndex <= other.dayIndex) && (this.dayIndex - this.weekDayIndex + 7 > other.dayIndex);
	}

	get firstOfMonth() {
		return new YphiliosDate(this.year, this.month, 1);
	}

	get lastOfMonth() {
		return new YphiliosDate(this.year, this.month, getMonthLength(this.monthName, this.year));
	}
}

export function getWeekPivotDays(year, month) {
	let pivotDays = [];
	let firstDay = new YphiliosDate(year, month, 1);
	pivotDays.push(firstDay);
	for(let siop = new YphiliosDate(year, month, (7-firstDay.weekDayIndex)+1); siop.month == month; siop = dateRelativeTo(siop, 7)) {
		pivotDays.push(siop);
	}
	return pivotDays;
}

const yearStartDays = {};
function getYearStartDay(year) {
	if (Object.hasOwn(yearStartDays, year)) {
		return yearStartDays[year];
	} else {
		let elapsedYears = (year - yearOffset);
		// On Yphilios even years are leap years. And so is 1622.
		// Thus, if elapsed years are odd, there's one more leap year than regular years.
		// If the elapsed years are even, there are an equal number of those elapsed.
		let elapsedRegularYears = Math.floor(elapsedYears/2);
		let elapsedLeapYears = elapsedRegularYears + (year % 2);
		let firstDayIndex = 372*elapsedRegularYears + 373*elapsedLeapYears;
		let weekDayIndex = (firstDayIndex + weekOffset) % dayNames.length;
		yearStartDays[year] = weekDayIndex;
		return weekDayIndex;
	}
}

export function yearFromIndex(index) {
	// If only I had defined the calendar without leap years...
	let yearDelta = 0;
	for(let days=0; days < index; yearDelta++) {
		days += (yearDelta % 2 == 0 ? 373 : 372);
	};
	return yearOffset + yearDelta - 1; // We're always overshooting by one, per definition
}

export function monthFromIndex(index) {
	let yearStartIndex = new YphiliosDate(yearFromIndex(index), 1, 1).dayIndex;
	let monthIndex = Math.ceil((index - yearStartIndex + 1) / 31);
	// Leap day
	if(monthIndex == 13) {
		monthIndex = 12;
	}
	return monthIndex;
}

export function dayFromIndex(index) {
	let monthStartIndex = new YphiliosDate(yearFromIndex(index), monthFromIndex(index), 1).dayIndex;
	return index - monthStartIndex + 1;
}

export function dateFromIndex(index) {
	return new YphiliosDate(yearFromIndex(index), monthFromIndex(index), dayFromIndex(index));
}

export function dateRelativeTo(date, delta = 0) {
	let index = date.dayIndex + delta;
	return dateFromIndex(index);
}
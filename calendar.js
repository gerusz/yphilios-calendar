import { YphiliosDate, dateRelativeTo, dayNames, getWeekPivotDays, getMonthLength } from "./calendar_data.js";

class CalendarEvent {

	constructor(name, cellClasses) {
		this.name = name;
		if (typeof cellClasses === "string") {
			this.cellClasses = [cellClasses];
		} else {
			this.cellClasses = cellClasses;
		}
	}

	get title() {
		return this.name;
	}

	get eventDetails() {
		return this.name;
	}
 
	eventInYear(year) {
		return null;
	}
}

class MarkedEvent extends CalendarEvent {
	constructor(name, date, cellClasses) {
		super(name, cellClasses);
		this.date = date;
	}

	eventInYear(year) {
		return [this]; // Ignores year
	}
}

class AnonymousEvent extends MarkedEvent {
	// This event is just marking a date without a name or class. Useful for multi-day events, etc...
	constructor(year, month, day) {
		super("", new YphiliosDate(year, month, day), []);
	}
}

class CalendarNote extends AnonymousEvent {
	// This represents an anonymous note in the calendar without a name or classes.
	constructor(year, month, day, note) {
		super(year, month, day);
		this.note = note;
	}

	get title() {
		return "";
	}

	get eventDetails() {
		return this.note;
	}
}

class YearlyEvent extends CalendarEvent {
	constructor(name, month, days, cellClasses) {
		super(name, cellClasses);
		this.month = month;
		this.days = days;
	}

	eventInYear(year) {
		// Generate a regular event for this year
		let eventDay = 0;
		if(typeof this.days === "number") {
			eventDay = this.days;
		} else {
			let yearModulo = year % this.days.length;
			eventDay = this.days[yearModulo];
		}
		// Allow for "last day of month" type events
		if(eventDay < 0) {
			eventDay = getMonthLength(this.month, year) + eventDay + 1;
		}
		return [new MarkedEvent(this.name, new YphiliosDate(year, this.month, eventDay), this.cellClasses)];
	}
}

class NthXdayEvent extends CalendarEvent {
	// Class for "nth Monday of X month" type of events like Mother's Day
	constructor(name, month, weekDayIndex, n, needsFullWeek, cellClasses) {
		super(name, cellClasses);
		this.month = month;
		this.weekDayIndex = weekDayIndex;
		this.n = n;
		this.needsFullWeek = needsFullWeek;
	}

	eventInYear(year) {
		let firstDayOfMonth = new YphiliosDate(year, this.month, 1);
		let firstXdayOfMonth = this.weekDayIndex-firstDayOfMonth.weekDayIndex+1;
		let firstWeekIsFractional = (firstDayOfMonth.weekDayIndex > 0);
		if((this.weekDayIndex < firstDayOfMonth.weekDayIndex) || (firstWeekIsFractional && this.needsFullWeek)) {
			firstXdayOfMonth +=7;
		}
		let firstXdayOfMonthDate = new YphiliosDate(year, this.month, firstXdayOfMonth);
		for(let idx=1; idx < this.n; idx++) {
			firstXdayOfMonthDate = dateRelativeTo(firstXdayOfMonthDate, 7);
		}
		return [new MarkedEvent(this.name, firstXdayOfMonthDate, this.cellClasses)];
	}
}

class MultidayEvent extends CalendarEvent {
	// Class for events covering a time span
	constructor(name, firstDay, lastDay, cellClasses) {
		super(name, cellClasses);
		// First and last days should be CalendarEvent objects and should not be
		// multiday events themselves
		this.firstDay = firstDay;
		this.lastDay = lastDay;
	}

	eventInYear(year) {
		let firstDayInYear = this.firstDay.eventInYear(year)[0];
		let lastDayInYear = this.lastDay.eventInYear(year)[0];

		let output = [];
		for (let i=firstDayInYear.date.dayIndex; i<=lastDayInYear.date.dayIndex; i++) {
			let offset = i - firstDayInYear.date.dayIndex;
			let eventDayDate = dateRelativeTo(firstDayInYear.date, offset);
			let eventDayName = `${this.name} day ${offset+1}`;
			output.push(new MarkedEvent(eventDayName, eventDayDate, this.cellClasses));
		}
		return output;
	}
}

class ResolvedEvent extends CalendarEvent {
	// Event that lazily resolves to another event
	constructor(name, eventKey, cellClasses) {
		super(name, cellClasses);
		this.eventKey = eventKey;
		this.referencedEvent = null;
	}

	eventInYear(year) {
		if(this.referencedEvent === null) {
			this.referencedEvent = events[this.eventKey];
		}
		return this.referencedEvent.eventInYear(year);
	}
}

class XDaysAfterEvent extends CalendarEvent {
	// Event that always occurs a fixed number of days after (or before, if it's negative) another one
	constructor(name, otherEvent, days, cellClasses) {
		super(name, cellClasses);
		this.otherEvent = otherEvent;
		this.days = days;
	}

	eventInYear(year) {
		let otherEventInYear = this.otherEvent.eventInYear(year);
		let otherEventEndDate = otherEventInYear[otherEventInYear.length-1].date;
		return [new MarkedEvent(this.name, dateRelativeTo(otherEventEndDate, this.days), this.cellClasses)];
	}
}

export const campaignDates = {
	"White Death": new MarkedEvent("White Death", new YphiliosDate(1622, 10, 13), ["campaign", "white_death"]),
	"The Necklace of Major-Baroness Stronich": new MarkedEvent("The Necklace of Major-Baroness Stronich", new YphiliosDate(1622, 9, 3), ["campaign", "stronich_necklace"]),
	"Airship Trip": new MarkedEvent("Airship Trip", new YphiliosDate(1622, 7, 10), ["campaign", "airship_trip"]),
	"The Wizard of Crow County": new MarkedEvent("The Wizard of Crow County", new YphiliosDate(1622, 4, 11), ["campaign", "crow_county"])
}

export const events = {
	"New Year": new YearlyEvent("New Year / Winter Solstice (S) / Summer Solstice (N)", 1, 1, "holiday"),
	"Spring Equinox": new YearlyEvent("Spring Equinox (S) / Autumn Equinox (N)", 4, 1, "observation"),
	"Summer Solstice": new YearlyEvent("Summer Solstice (S) / Winter Solstice (N)", 7, 1, "observation"),
	"Autumn Equinox": new YearlyEvent("Autumn Equinox (S) / Spring Equinox (N)", 10, 1, "observation"),
	"Arykamlesi Midspring Festival": new YearlyEvent("Arykamlesi Midspring Festival", 11, 15, "holiday"),
	"NYE": new YearlyEvent("New Year's Eve", 12, -1, "holiday"),
	"Mothers' Day": new NthXdayEvent("Mothers' Day", 5, 6, 1, true, "observation"),
	"Cruinneach Summer Festival": new NthXdayEvent("Cruinneach Summer Festival", 2, 5, 2, false, "holiday"),
	"Auberins Day of Freedom": new YearlyEvent("Auberins Day of Freedom", 3, 23, "holiday"),
	"Caemlun's Day of Unity": new NthXdayEvent("Caemlun's Day of Unity", 6, 5, 2, false, "holiday"),
	"Tälvi's Rest": new MultidayEvent("Tälvi's Rest", new YearlyEvent("", 1, 2, ""), new YearlyEvent("", 1, 6, ""), "observation"),
	"Sarkon's Reign": new MultidayEvent("Sarkon's Reign", new NthXdayEvent("", 8, 0, 2, true, ""), new NthXdayEvent("", 8, 6, 2, true, ""), "observation"),
	"The Thunder Games": new NthXdayEvent("The Thunder Games", 7, 1, 2, false, "holiday")
};

export const previousCampaigns = {
	"Airship Trip": new MultidayEvent("Airship Trip", new AnonymousEvent(1622, 7, 7), new AnonymousEvent(1622, 7, 10), ["previous-campaign", "airship_trip"]),
	"White Death": new MultidayEvent("White Death", new AnonymousEvent(1622, 10, 1), new AnonymousEvent(1622, 10, 13), ["previous-campaign", "white_death"]),
	"Long Shadow": new MultidayEvent("Long Shadow", new AnonymousEvent(1622, 6, 27), new AnonymousEvent(1622, 6, 31), ["previous-campaign", "long-shadow"]),
	"A Fold of Wolves": new MultidayEvent("A Fold of Wolves", new AnonymousEvent(1622, 6, 21), new AnonymousEvent(1622, 6, 24), ["previous-campaign", "fold-of-wolves"]),
	"An Auction of Curiosities": new MultidayEvent("An Auction of Curiosities", new AnonymousEvent(1622, 6, 14), new AnonymousEvent(1622, 6, 20), ["previous-campaign", "auction-of-curiosities"]),
	"Plugging the Leak": new MultidayEvent("Plugging the Leak", new AnonymousEvent(1622, 6, 11), new AnonymousEvent(1622, 6, 13), ["previous-campaign", "plugging-the-leak"])
}

export const calendarNotes = [
	new CalendarNote(1622, 6, 11, "The party arrives in Cruinneach"),
	new CalendarNote(1622, 6, 11, "The party tracks down Zara"),
	new CalendarNote(1622, 6, 12, "The party eliminates the cultist cell"),
	new CalendarNote(1622, 6, 13, "The party returns the map and is hired to infiltrate an auction"),
	new CalendarNote(1622, 6, 14, "The party finds the invite and the ship's figurehead"),
	new CalendarNote(1622, 6, 15, "The party's first encounter with Clarice Emerton / \"Cheeky\" Gina Greasebones, the green hag"),
	new CalendarNote(1622, 6, 16, "The party flies to the auction"),
	new CalendarNote(1622, 6, 17, "The first day of auction, mix & mingle, etc..."),
	new CalendarNote(1622, 6, 18, "The second day of auction, *insert \"It's Always Sunny in Philadelphia\" music* <span class=\"handwriting\">The party decides to blow up a pirate airship.</span>"),
	new CalendarNote(1622, 6, 19, "The party departs the auction after being held for questioning."),
	new CalendarNote(1622, 6, 19, "Ashdagh is captured by cultists. Fight with some cultists in Jaghthonagh's home dimension."),
	new CalendarNote(1622, 6, 20, "The party returns to Cruinneach and discovers a traitor.")
]

const markedDates = {};

function clearContainer(containerElement) {
	while(containerElement.hasChildNodes()) {
		containerElement.removeChild(containerElement.firstChild);
	}
}

function generateMarkedDates(year=null) {
	Object.keys(markedDates).forEach(key => {
		delete markedDates[key];
	});
	let eventsToAdd = [];
	
	// First, add the possibly-repeating events
	for(let [,event] of Object.entries(events)) {
		eventsToAdd.push(...event.eventInYear(year)); // Singular event
	}

	// Add the previous campaigns
	Object.entries(previousCampaigns).forEach(([, details]) => {
		let markedDays = details.eventInYear(year);
		if(markedDays[0].date.year == year || markedDays[markedDays.length-1].date.year == year) {
			eventsToAdd.push(...markedDays);
		}
	});

	// Add the current campaigns
	Object.entries(campaignDates).forEach(([, details]) => {
		if(details.date.year == year) eventsToAdd.push(details); // These are all single entries
	});

	// Add the notes. They don't have classes anyway.
	for(let calNote of calendarNotes) {
		if(calNote.date.year == year) eventsToAdd.push(calNote);
	}

	for(let details of eventsToAdd) {
		let dayIndex = details.date.dayIndex;
		markedDates[dayIndex] = (markedDates[dayIndex] ?? []).concat([details]);
	}
}

export function renderYear(date, container) {
	clearContainer(container);
	generateMarkedDates(date.year);
	let year = (typeof date === "number" ? date : date.year);
	let calendarHeader = document.createElement("h1");
	calendarHeader.className="text-center";

	let previousYearLink = document.createElement("abbr");
	previousYearLink.title = `${date.year-1}`;
	previousYearLink.innerHTML = "&lt;&lt; |";
	previousYearLink.addEventListener("click", () => renderYear(new YphiliosDate(date.year-1, 1, 1), container));
	calendarHeader.appendChild(previousYearLink);

	let yearSpan = document.createElement("span");
	yearSpan.innerHTML = year;
	calendarHeader.appendChild(yearSpan);

	let nextYearLink = document.createElement("abbr");
	nextYearLink.title = `${date.year+1}`;
	nextYearLink.innerHTML = "| &gt;&gt;";
	nextYearLink.addEventListener("click", () => renderYear(new YphiliosDate(date.year+1, 1, 1), container));
	calendarHeader.appendChild(nextYearLink);

	container.appendChild(calendarHeader);

	let yearContainer = document.createElement("div");
	yearContainer.classList.add("d-flex");
	yearContainer.classList.add("flex-wrap");
	yearContainer.classList.add("justify-content-between");
	container.appendChild(yearContainer);

	for(let month=1; month <= 12; month++) {
		renderMonth(new YphiliosDate(year, month, 1), yearContainer, true, false);
	}
}

export function renderMonth(date, container, shortHeaders = false, singleMonth = true) {
	if(singleMonth) {
		clearContainer(container);
		let header = document.createElement("h1");
		header.className="text-center";

		let previousMonthLink = document.createElement("abbr");
		let prevMonthYear = date.year;
		if(date.month == 1) {
			prevMonthYear = date.year-1;
		}
		let prevMonth = date.month - 1;
		if(prevMonth == 0) {
			prevMonth = 12;
		}
		previousMonthLink.title = `${prevMonthYear}/${prevMonth}`;
		previousMonthLink.innerHTML = "&lt;&lt; |";
		previousMonthLink.addEventListener("click", () => zoomMonth(prevMonthYear, prevMonth));
		header.appendChild(previousMonthLink);

		let yearSpan = document.createElement("abbr");
		yearSpan.title = "Back to year view"
		yearSpan.innerHTML=date.year;
		yearSpan.addEventListener("click", () => renderYear(date, container));
		header.appendChild(yearSpan);

		let monthSpan = document.createElement("span")
		monthSpan.innerHTML = `/${date.month}: ${date.monthName}`;
		header.appendChild(monthSpan);

		let nextMonthLink = document.createElement("abbr");
		let nextMonthYear = date.year;
		if(date.month == 12) {
			nextMonthYear = date.year+1;
		}
		let nextMonth = date.month + 1;
		if(nextMonth == 13) {
			nextMonth = 1;
		}
		nextMonthLink.title = `${nextMonthYear}/${nextMonth}`;
		nextMonthLink.innerHTML = "| &gt;&gt;";
		nextMonthLink.addEventListener("click", () => zoomMonth(nextMonthYear, nextMonth));
		header.appendChild(nextMonthLink);

		container.appendChild(header);
	}
	let monthTable = document.createElement("table");
	let monthCard = document.createElement("div");
	monthCard.classList.add("card", "text-bg-dark", "month-card");

	if(!singleMonth) {
		let monthCardTitle = document.createElement("h2");
		let monthNameLink = document.createElement("abbr");
		monthCardTitle.appendChild(monthNameLink);
		monthCardTitle.classList.add("text-center", "card-title");
		monthNameLink.innerHTML = `${date.month}: ${date.monthName}`;
		monthNameLink.title = `Zoom to ${date.year}/${date.month} (${date.monthName})`;
		monthCardTitle.addEventListener("click", () => zoomMonth(date.year, date.month));
		monthCard.appendChild(monthCardTitle);
	}

	monthCard.appendChild(monthTable);
	monthTable.classList.add("table");
	monthTable.classList.add("caption-top");
	monthTable.classList.add("table-sm");
	monthTable.classList.add("table-dark");
	monthTable.classList.add("month-table");
	monthTable.classList.add("text-end");
	container.appendChild(monthCard);

	let monthTableHeader = dayNamesHeader("", [], shortHeaders);
	monthTable.appendChild(monthTableHeader);

	let pivotDays = getWeekPivotDays(date.year, date.month);
	let lastDay = date.lastOfMonth;
	let tbody = document.createElement("tbody");
	tbody.className="table-group-divider";
	monthTable.appendChild(tbody);
	for(let pivotDay of pivotDays) {
		let row = renderWeekRow(pivotDay);
		tbody.appendChild(row);
	}

	if(pivotDays.length == 5) {
		// Add a dummy row to the bottom of the table
		let dummyRow = document.createElement("tr");
		dummyRow.className = "week-row";
		let dummyCell = document.createElement("th");
		dummyCell.innerHTML = "&#x2800;";
		dummyRow.appendChild(dummyCell);
		let spacerCell = document.createElement("td");
		spacerCell.colSpan = 7;
		dummyRow.appendChild(spacerCell);
		tbody.appendChild(dummyRow);
	}
}

export function renderWeek(date, container) {
	clearContainer(container);

	let weekStartDelta = -date.weekDayIndex;
	let weekEndDelta = 6-date.weekDayIndex;
	let firstDay = dateRelativeTo(date, weekStartDelta);
	let lastDay = dateRelativeTo(date, weekEndDelta);

	let previousWeekFirstDay = dateRelativeTo(firstDay, -7);
	let nextWeekFirstDay = dateRelativeTo(lastDay, 1);

	let weekHeader = document.createElement("h1");
	weekHeader.className="text-center";

	let previousWeekLink = document.createElement("abbr");
	previousWeekLink.title = `${previousWeekFirstDay.year}/W${previousWeekFirstDay.weekIndex}`;
	previousWeekLink.innerHTML = "&lt;&lt; |";
	previousWeekLink.addEventListener("click", () => renderWeek(previousWeekFirstDay, container));
	weekHeader.appendChild(previousWeekLink);

	let yearLink = document.createElement("abbr");
	yearLink.title = "Back to year view";
	yearLink.innerHTML = `Year ${firstDay.year}`;
	yearLink.addEventListener("click", () => renderYear(date, container));
	weekHeader.appendChild(yearLink);

	let weekTitleSpan = document.createElement("span");
	weekTitleSpan.innerHTML = `, Week ${firstDay.weekIndex} (${firstDay.shortDateString} - ${lastDay.shortDateString})`;
	weekHeader.appendChild(weekTitleSpan);

	let nextWeekLink = document.createElement("abbr");
	nextWeekLink.title = `${nextWeekFirstDay.year}/W${nextWeekFirstDay.weekIndex}`;
	nextWeekLink.innerHTML = "| &gt;&gt;";
	nextWeekLink.addEventListener("click", () => renderWeek(nextWeekFirstDay, container));
	weekHeader.appendChild(nextWeekLink);

	container.appendChild(weekHeader);

	let weekContainer = document.createElement("div");
	weekContainer.classList.add("d-lg-flex", "flex-column");
	weekContainer.classList.add("flex-wrap");
	container.appendChild(weekContainer);
	for(let delta=weekStartDelta; delta <= weekEndDelta; delta++) {
		let day = dateRelativeTo(date, delta);
		weekContainer.appendChild(extendedDayCell(day, []));
	}
}

export function zoomMonth(year, month){
	let container = document.getElementById("calendar-container");
	let monthStart = new YphiliosDate(year, month, 1);
	renderMonth(monthStart, container, false, true);
}

export function zoomWeek(year, week) {
	let container = document.getElementById("calendar-container");
	let yearStart = new YphiliosDate(year, 1, 1);
	// Find a day in the given week
	let aDayInThatWeek = dateRelativeTo(yearStart, 7*(week-1));
	renderWeek(aDayInThatWeek, container);
}

function renderWeekRow(date, showOtherMonth = false) {
	let weekStartDelta = -date.weekDayIndex;
	let weekEndDelta = 6-date.weekDayIndex;

	let row = document.createElement("tr");
	row.id = `week${date.weekIndex}`;

	let weekNumberCell = document.createElement("th");
	let weekNumberLink = document.createElement("abbr");
	weekNumberCell.appendChild(weekNumberLink);
	weekNumberLink.innerHTML = date.weekIndex;
	weekNumberCell.addEventListener("click", () => zoomWeek(date.year, date.weekIndex));
	weekNumberLink.title = `Zoom to ${date.year}/W${date.weekIndex}`;
	row.appendChild(weekNumberCell);
	row.classList.add("week-row");

	for(let delta=weekStartDelta; delta <= weekEndDelta; delta++) {
		let day = dateRelativeTo(date, delta);
		if(day.month != date.month) {
			if(showOtherMonth) {
				row.appendChild(simpleDayCell(day, [], day.year != date.year, true));
			} else {
				row.appendChild(document.createElement("td"));
			}
		} else {
			row.appendChild(simpleDayCell(day));
		}
	}
	return row;
}

function simpleDayCell(date, cellClassList=[], includeYear = false, includeMonth = false) {
	let cellContent = "";
	if(includeYear) {
		cellContent += `${date.year}/`;
	}
	if(includeMonth || includeYear) {
		cellContent += `${date.month}/`;
	}
	cellContent += `${date.day}`;

	let fullClassList = [`weekday${date.weekDayIndex}`];
	fullClassList = fullClassList.concat(cellClassList);
	let dayEvents = markedDates[date.dayIndex] ?? []
	if(dayEvents.length > 0) {
		let eventTitles = []
		for (let dayEvent of dayEvents) {
			fullClassList = fullClassList.concat(dayEvent.cellClasses);
			if(dayEvent.title) {
				eventTitles.push(dayEvent.title);
			}
		}
		let eventLine = eventTitles.join(", ");
		cellContent = `<abbr title="${eventLine}">${cellContent}</abbr>`;
	}

	let cell = document.createElement("td");
	cell.innerHTML = cellContent;
	cell.classList.add(...fullClassList);
	cell.id = `day${date.dayIndex}`
	return cell;
}

function extendedDayCell(date, cellClassList=[]) {
	// Renders a single day cell.
	let cell = document.createElement("div");
	cell.id = `day${date.dayIndex}`
	let fullClassList = [`weekday${date.weekDayIndex}`, "card", "text-bg-dark", "day-card"];
	fullClassList = fullClassList.concat(cellClassList);
	cell.classList.add(...fullClassList);

	// Header
	let dayCardTitle = document.createElement("h3");
	cell.appendChild(dayCardTitle);
	dayCardTitle.classList.add("text-center", "card-title");
	let headerClassList = [];
	let dayEvents = markedDates[date.dayIndex] ?? [];
	let eventDetails = [];
	let eventNameStyles = [];
	if(dayEvents.length > 0) {
		for (let dayEvent of dayEvents) {
			headerClassList = headerClassList.concat(dayEvent.cellClasses);
			eventDetails.push(dayEvent.eventDetails);
			eventNameStyles.push(dayEvent.cellClasses);
		}
	}
	dayCardTitle.classList.add(...headerClassList);
	//Build the header content with the month links
	let monthSpan = document.createElement("span");
	monthSpan.addEventListener("click", () => zoomMonth(date.year, date.month));
	monthSpan.innerHTML = `${date.year} ${date.monthName}`;
	dayCardTitle.appendChild(monthSpan);
	let daySpan = document.createElement("span");
	daySpan.innerHTML = ` ${date.day}, ${date.weekDay}`;
	dayCardTitle.appendChild(daySpan);

	let dayCardSubtitle = document.createElement("h4");
	cell.appendChild(dayCardSubtitle);
	dayCardSubtitle.classList.add("text-center", "card-subtitle");
	dayCardSubtitle.innerHTML = `Day #${date.dayOfYearIndex} of the year`;

	// Then create the nested table body and add the events
	let eventList = document.createElement("ul");
	eventList.classList.add("list-group", "list-group-flush");
	cell.appendChild(eventList);

	let moonPhasesTable = document.createElement("table");
	moonPhasesTable.classList.add("table", "table-dark");
	let moonPhasesListItem = document.createElement("li");
	moonPhasesListItem.className = "list-group-item";
	eventList.appendChild(moonPhasesListItem);
	moonPhasesListItem.appendChild(moonPhasesTable);

	let moonPhases = date.moonPhaseData;

	let cellContentHeader = document.createElement("thead")
	moonPhasesTable.appendChild(cellContentHeader);
	// First, let's add an overreaching header cell
	let cellContentHeaderRow = document.createElement("tr");
	cellContentHeader.appendChild(cellContentHeaderRow);

	// Then add the moon phase rows to the header
	let moonNamesRow = document.createElement("tr");
	cellContentHeader.appendChild(moonNamesRow);
	let moonPhasesRow = document.createElement("tr");
	cellContentHeader.appendChild(moonPhasesRow);
	for(let [moonName, moonData] of Object.entries(moonPhases)) {
		let moonNameCell = document.createElement("th");
		moonNamesRow.appendChild(moonNameCell);
		moonNameCell.classList.add("text-center")

		let moonPhaseCell = document.createElement("th");
		moonPhasesRow.appendChild(moonPhaseCell);
		moonPhaseCell.classList.add("text-center")

		let moonNameSpan = document.createElement("span");
		moonNameCell.appendChild(moonNameSpan);
		let moonPhaseSpan = document.createElement("span");
		moonPhaseCell.appendChild(moonPhaseSpan);

		moonNameSpan.style.color=`${moonData.color}`;
		moonPhaseSpan.style.color=`${moonData.color}`;

		moonNameSpan.innerHTML = moonName;
		let moonPhaseSymbol = document.createElement("abbr");
		moonPhaseSpan.appendChild(moonPhaseSymbol);
		moonPhaseSymbol.title = `${moonData.phase + 1}/${moonData.period}`;
		moonPhaseSymbol.innerHTML = moonData.symbol;
	}

	for(let eventIdx=0; eventIdx < eventDetails.length; eventIdx++) {
		let eventListItem = document.createElement("li");
		eventList.appendChild(eventListItem);
		eventListItem.classList.add(...eventNameStyles[eventIdx]);
		eventListItem.classList.add("list-group-item")
		eventListItem.innerHTML = eventDetails[eventIdx];
	}

	if(eventDetails.length == 0) {
		let noEventListItem = document.createElement("li");
		noEventListItem.innerHTML = "No events";
		noEventListItem.classList.add("list-group-item")
		eventList.appendChild(noEventListItem);
	}

	return cell;
}

function dayNamesHeader(headerId="", headerClassList=[], short = false) {
	// Renders a header containing all the day names. It is wrapped in a thead object.
	let header = document.createElement("thead");
	header.id = headerId;
	header.classList.add(...headerClassList);
	header.classList.add("day-names-header");

	let headerRow = document.createElement("tr");
	header.appendChild(headerRow);
	
	let weekNumberHeaderCell = document.createElement("th");
	weekNumberHeaderCell.className = "weeknumber";
	weekNumberHeaderCell.innerHTML = short ? "W#" : "Week #";
	headerRow.appendChild(weekNumberHeaderCell);

	dayNames.forEach((dn, di) => {
		let dayNameCell = document.createElement("th");
		dayNameCell.className = `weekday${di}`;
		dayNameCell.innerHTML = short ? `<abbr title='${dn}'>${dn[0]}</abbr>` : dn;
		headerRow.appendChild(dayNameCell);
	});

	return header;
}
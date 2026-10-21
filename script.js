
/* CaffTrack 1.5: optional drink decoration and exact 30-minute time. */
const V15_COLORS = Object.freeze({blue:'#659fcb',purple:'#a282d2',pink:'#e39ac2',teal:'#59abb0',coral:'#e39b86',gold:'#caa45b'});
let v15SelectedColors = {log:'blue',savedDrink:'blue',editSavedDrink:'blue',editDrink:'blue'};
function chooseDrinkColor(form, color) {
    if (!Object.hasOwn(V15_COLORS,color)) return;
    v15SelectedColors[form] = color;
    document.querySelectorAll(`[data-palette="${form}"] .v15-swatch`).forEach(btn=>{
        const active = btn.dataset.color === color;
        btn.classList.toggle('chosen',active);
        btn.setAttribute('aria-pressed',String(active));
    });
}
function v15Ounces(id) {
    const el=document.getElementById(id+'Ounces');
    const raw=el?.value?.trim();
    if (!raw) return null;
    const value=Number(raw);
    if(!Number.isFinite(value)||value<=0||value>256){alert('Ounces must be between 0.1 and 256, or left blank.');return false;}
    return Math.round(value*10)/10;
}
function v15ClockText(slot){
    slot=Math.max(0,Math.min(47,Number(slot)||0));
    const h=Math.floor(slot/2),m=slot%2? '30':'00';
    return `${h%12||12}:${m} ${h<12?'AM':'PM'}`;
}
function updateClockLabel(prefix){
    const input=document.getElementById(prefix+'Clock');
    const output=document.getElementById(prefix+'TimeLabel');
    if(input&&output){output.textContent=v15ClockText(input.value);input.style.setProperty('--clock-fill',`${Number(input.value)/47*100}%`);}
}
function v15SetClock(prefix,slot){
    const el=document.getElementById(prefix+'Clock');
    if(el){el.value=String(Math.max(0,Math.min(47,slot)));updateClockLabel(prefix);}
}
function v15NowSlot(){const d=appDate();return Math.min(47,Math.floor((d.getHours()*60+d.getMinutes()+15)/30));}
function v15LegacySlot(entry){
    const t=String(entry?.timeOfDay||'').toLowerCase();
    return t==='morning'?18:t==='afternoon'?26:t==='night'?34:null;
}
function v15EntrySlot(entry){
    if(Number.isInteger(entry?.timeSlot)&&entry.timeSlot>=0&&entry.timeSlot<=47)return entry.timeSlot;
    return v15LegacySlot(entry);
}
function v15Period(slot){const h=Math.floor(slot/2);return h<12?'morning':h<18?'afternoon':'night';}
function v15SavedByName(name){return getMyDrinks().find(d=>normalizeDrinkName(d.name)===normalizeDrinkName(name));}
function v15FillLoggerFromDrink(drink){
    if(!drink)return;
    chooseDrinkColor('log',Object.hasOwn(V15_COLORS,drink.color)?drink.color:'blue');
    const oz=document.getElementById('logOunces');if(oz)oz.value=drink.ounces??'';
}
function v15ValidateOunces(form){const result=v15Ounces(form);return result!==false;}

const STORAGE_KEY = "caffTrackData";
const APP_VERSION = "1.5.5 Beta";
const MAX_CAFFEINE_PER_DRINK = 999;

let data = loadData();
let devDate = null;


/* =========================
   DATA
========================= */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed && parsed.days) {
                if (!Object.prototype.hasOwnProperty.call(parsed, "commitment")) {
                    parsed.commitment = null;
                }

                return parsed;
            }
        }
    } catch (error) {
        console.error("Could not load CaffTrack data.", error);
    }

   return {
    days: {},
    commitment: null,
    myDrinks: []
};
}


function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* =========================
   DATES
========================= */

function appDate() {
    return devDate
        ? new Date(devDate)
        : new Date();
}


function dateKey(date) {
    const y = date.getFullYear();

    const m = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const d = String(
        date.getDate()
    ).padStart(2, "0");

    return `${y}-${m}-${d}`;
}


function getDay(offset = 0) {
    const date = appDate();

    date.setDate(
        date.getDate() + offset
    );

    return date;
}


function getDayData(
    key = dateKey(appDate())
) {
    if (!data.days[key]) {
        data.days[key] = {
            caffeine: 0,
            drinks: 0,
            entries: []
        };
    }

    if (!Array.isArray(data.days[key].entries)) {
        data.days[key].entries = [];
    }

    return data.days[key];
}


/* =========================
   COMMITMENT
========================= */

function hasCommitted() {
    return !!data.commitment;
}


function commitmentDate() {
    if (!data.commitment) {
        return null;
    }

    return new Date(
        data.commitment + "T00:00:00"
    );
}


function commitToQuit() {
    if (hasCommitted()) {
        closeCommitment();
        showPage("home");
        return;
    }

    data.commitment = dateKey(new Date());

    saveData();

    closeCommitment();

    showPage("home");

    updateApp();
}


function closeCommitment() {
    const screen =
        document.getElementById(
            "commitmentScreen"
        );

    if (screen) {
        screen.classList.add("hidden");
    }
}


function showCommitment() {
    if (hasCommitted()) {
        closeCommitment();
        return;
    }

    const screen =
        document.getElementById(
            "commitmentScreen"
        );

    if (screen) {
        screen.classList.remove("hidden");
    }
}


/* =========================
   NAVIGATION
========================= */

function showPage(page) {
    const pages = [
        "homePage",
        "historyPage",
        "drinksPage",
        "progressPage",
        "settingsPage"
    ];

    pages.forEach(id => {
        const element =
            document.getElementById(id);

        if (element) {
            element.classList.add("hidden");
        }
    });

    const selected =
        document.getElementById(
            page + "Page"
        );

    if (selected) {
        selected.classList.remove("hidden");
    }

    const nav =
        document.querySelectorAll(
            ".nav-item"
        );

    nav.forEach(item => {
        item.classList.remove("active");
    });

   const index = {
    home: 0,
    history: 1,
    drinks: 2,
    progress: 3,
    settings: 4
}[page];

    if (nav[index]) {
        nav[index].classList.add("active");
    }

    if (page === "history") {
        renderHistory();
        preparePastDatePicker();
        refreshVisibleHistoryTrend();
    }

if (page === "drinks") {
    renderMyDrinks();
}

    if (page === "progress") {
        renderProgress();
    }
}


/* =========================
   LOGGER
========================= */

function openLogger(selectedDate = null) {
    document
        .getElementById("logger")
        .classList.add("active");

    const dateInput =
        document.getElementById("drinkDate");

    if (dateInput) {
        dateInput.value =
            selectedDate ||
            dateKey(appDate());

        dateInput.max =
            dateKey(new Date());
    }

    document.getElementById('logFlavor').value='';
    hideFlavorSuggestions();
    hideDrinkSuggestions();
    v15SetClock('log',v15NowSlot());
    chooseDrinkColor('log','blue');
    document.getElementById('logOunces').value='';

    clearAmountSelection();

    const customInput =
        document.getElementById("customAmount");

    if (customInput) {
        customInput.value = "";
    }

    setTimeout(() => {
        const input =
            document.getElementById("drinkName");

      if (input) {
    // Suggestions open only when the person taps into the name field.
    hideDrinkSuggestions();
}
    }, 100);
}


function getSuggestedTimeOfDay() {
    const hour =
        appDate().getHours();

    if (hour < 12) {
        return "morning";
    }

    if (hour < 18) {
        return "afternoon";
    }

    return "night";
}


function selectTimeOfDay(time) {
    document
        .querySelectorAll(".time-button")
        .forEach(button => {
            button.classList.toggle(
                "selected",
                button.dataset.time === time
            );
        });
}


function getSelectedTimeOfDay() {
    const selected =
        document.querySelector(
            ".time-button.selected"
        );

    return selected
        ? selected.dataset.time
        : getSuggestedTimeOfDay();
}


function closeLogger() {
    document
        .getElementById("logger")
        .classList.remove("active");
}


function addCaffeine(amount) {
    amount = Number(amount);

if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > MAX_CAFFEINE_PER_DRINK
) {
    alert(
        "Caffeine must be a whole number between 1 and 999 mg."
    );

    return;
}
    const nameInput =
        document.getElementById("drinkName");

    const name =
        nameInput.value.trim() ||
        "Caffeine";

    const dateInput =
        document.getElementById("drinkDate");

    const selectedDate =
        dateInput.value ||
        dateKey(appDate());

    const timeSlot = Number(document.getElementById('logClock').value);
    const timeOfDay = v15Period(timeSlot);
    const ounces=v15Ounces('log');
    if(ounces===false)return;

    const day =
        getDayData(selectedDate);

    day.entries.push({
        id:
            Date.now().toString() +
            Math.random(),

        name:
            name,

        amount:
            amount,

        timeOfDay:timeOfDay,
        timeSlot:timeSlot,
        color:v15SelectedColors.log,
        ounces:ounces,
        flavor:document.getElementById('logFlavor')?.value.trim().slice(0,60) || ''
    });

    day.caffeine =
        day.entries.reduce(
            (total, entry) =>
                total +
                Number(entry.amount || 0),
            0
        );

    day.drinks =
    day.entries.length;


/* SAVE AS MY DRINK */

const saveToMyDrinks =
    document.getElementById(
        "saveToMyDrinks"
    );

if (
    saveToMyDrinks &&
    saveToMyDrinks.checked
) {
    const alreadySaved =
        getMyDrinks().some(drink =>
            normalizeDrinkName(drink.name) ===
            normalizeDrinkName(name)
        );

    if (!alreadySaved) {
        getMyDrinks().push({
            id:
                Date.now().toString() +
                Math.random(),

            name:
                name,

            amount:
                amount,

            color:v15SelectedColors.log,
            ounces:ounces,
            createdAt:
                Date.now()
        });
    }
}


saveData();

    closeLogger();
    document.getElementById('logFlavor').value='';
    hideFlavorSuggestions();

    nameInput.value = "";

    document
        .getElementById("customAmount")
        .value = "";

    clearAmountSelection();

const saveCheckbox =
    document.getElementById(
        "saveToMyDrinks"
    );

const saveOption =
    document.getElementById(
        "saveToMyDrinksOption"
    );

if (saveCheckbox) {
    saveCheckbox.checked = false;
}

if (saveOption) {
    saveOption.classList.add("hidden");
}

updateApp();
}


function selectAmount(amount) {
    const customInput =
        document.getElementById("customAmount");

    if (customInput) {
        customInput.value = amount;
    }

    document
        .querySelectorAll(".amount-grid button")
        .forEach(button => {
            const buttonAmount =
                Number(
                    button.textContent
                        .replace("mg", "")
                        .trim()
                );

            button.classList.toggle(
                "selected",
                buttonAmount === Number(amount)
            );
        });
}


function clearAmountSelection() {
    document
        .querySelectorAll(".amount-grid button")
        .forEach(button => {
            button.classList.remove("selected");
        });
}


function addCustom() {
    const amount =
        Number(
            document
                .getElementById(
                    "customAmount"
                )
                .value
        );

  if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > MAX_CAFFEINE_PER_DRINK
) {
    alert(
        "Caffeine must be a whole number between 1 and 999 mg."
    );

    return;
}

    addCaffeine(amount);
}


/* =========================
   PAST-DATE LOGGING
========================= */
function formatPastDate(input) {
    let numbers =
        input.value.replace(/\D/g, "");

    numbers =
        numbers.slice(0, 8);

    if (numbers.length >= 5) {
        input.value =
            numbers.slice(0, 2) +
            "/" +
            numbers.slice(2, 4) +
            "/" +
            numbers.slice(4);
    }

    else if (numbers.length >= 3) {
        input.value =
            numbers.slice(0, 2) +
            "/" +
            numbers.slice(2);
    }

    else {
        input.value = numbers;
    }
}

function preparePastDatePicker() {
    const input = document.getElementById("pastDrinkDate");
    if (!input) return;

    const today = dateKey(new Date());

    input.max = today;

    if (!input.value) {
        input.value = today;
    }
}


function pastDateSelected() {
    const input = document.getElementById("pastDrinkDate");
    if (!input) return;

    const selectedDate = input.value;

    if (!selectedDate) {
        alert("Please choose a date.");
        return;
    }

    const today = dateKey(new Date());

    if (selectedDate > today) {
        alert("You can't log caffeine for a future date.");
        return;
    }

  openLogger(selectedDate);
input.value = dateKey(new Date());
}

/* =========================
   EDIT DRINK MODAL
========================= */

let editingDrink = null;
let editingDrinkTime = "morning";

function editDrink(dayKey, id) {
    const day = data.days[dayKey];

    if (!day || !Array.isArray(day.entries)) return;

    const drink = day.entries.find(
        entry => String(entry.id) === String(id)
    );

    if (!drink) return;

    editingDrink = { dayKey, id };

    document.getElementById("editDrinkName").value =
        drink.name || "";

    document.getElementById("editDrinkAmount").value =
        drink.amount;

    document.getElementById("editDrinkError").textContent = "";

    v15SetClock('editDrink',v15EntrySlot(drink) ?? 18);
    document.getElementById('editDrinkOunces').value=drink.ounces??'';
    document.getElementById('editDrinkFlavor').value=drink.flavor || '';
    hideFlavorSuggestions();
    chooseDrinkColor('editDrink',Object.hasOwn(V15_COLORS,drink.color)?drink.color:'blue');

    document.getElementById("editDrinkOverlay")
        .classList.remove("hidden");

    document.body.classList.add("editing-drink");

    document.getElementById("editDrinkName").focus();
}

function selectEditDrinkTime(time) {
    if (!["morning", "afternoon", "night"].includes(time)) return;

    editingDrinkTime = time;

    document.querySelectorAll("[data-edit-time]")
        .forEach(button => {
            const selected = button.dataset.editTime === time;

            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
}

function closeEditDrink() {
    document.getElementById("editDrinkOverlay")
        ?.classList.add("hidden");

    document.body.classList.remove("editing-drink");

    editingDrink = null;
}

function saveEditedDrink(event) {
    event.preventDefault();

    if (!editingDrink) return;

    const name = document.getElementById("editDrinkName")
        .value.trim();

    const amount = Number(
        document.getElementById("editDrinkAmount").value
    );

    const error = document.getElementById("editDrinkError");

    if (!name) {
        error.textContent = "Please enter a drink name.";
        return;
    }

    if (
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > MAX_CAFFEINE_PER_DRINK
    ) {
        error.textContent =
            "Enter a whole number between 1 and 999 mg.";
        return;
    }

    const day = data.days[editingDrink.dayKey];

    const drink = day?.entries?.find(
        entry => String(entry.id) === String(editingDrink.id)
    );

    if (!drink) {
        error.textContent = "This drink could not be found.";
        return;
    }

    drink.name = name;
    drink.amount = amount;
    drink.flavor = document.getElementById('editDrinkFlavor')?.value.trim().slice(0,60) || '';
    const ounces=v15Ounces('editDrink');
    if(ounces===false)return;
    drink.ounces=ounces;
    drink.color=v15SelectedColors.editDrink;
    drink.timeSlot=Number(document.getElementById('editDrinkClock').value);
    drink.timeOfDay=v15Period(drink.timeSlot);

    day.caffeine = day.entries.reduce(
        (total, entry) => total + Number(entry.amount || 0),
        0
    );

    day.drinks = day.entries.length;

    saveData();
    closeEditDrink();
    updateApp();
}

// Close when tapping outside the modal or pressing Escape
document.addEventListener("click", event => {
    if (event.target?.id === "editDrinkOverlay") {
        closeEditDrink();
    }
});

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        !document.getElementById("editDrinkOverlay")
            ?.classList.contains("hidden")
    ) {
        closeEditDrink();
    }
});


/* =========================
   REMOVE DRINK
========================= */

function removeDrink(dayKey, id) {
    const day =
        data.days[dayKey];

    if (
        !day ||
        !Array.isArray(day.entries)
    ) {
        return;
    }

    const drink =
        day.entries.find(
            entry =>
                String(entry.id) ===
                String(id)
        );

    if (!drink) {
        return;
    }

    if (
        !confirm(
            `Remove "${drink.name}" (${drink.amount} mg)?`
        )
    ) {
        return;
    }

    day.entries =
        day.entries.filter(
            entry =>
                String(entry.id) !==
                String(id)
        );

    day.caffeine =
        day.entries.reduce(
            (total, entry) =>
                total +
                Number(
                    entry.amount || 0
                ),
            0
        );

    day.drinks =
        day.entries.length;

    saveData();

    updateApp();

    renderHistory();
}


/* =========================
   HOME
========================= */

function updateHome() {
    const today =
        getDayData();

    const total =
        sevenDayTotal();

    setText(
        "todayCaffeine",
        today.caffeine
    );

    setText(
        "drinkCount",
        today.drinks
    );

    setText(
        "streak",
        caffeineFreeStreak()
    );

    setText(
        "weeklyTotal",
        total + " mg"
    );

    setText(
        "weeklyTotalStats",
        total
    );

    setText(
        "freeDays",
        freeDays()
    );

    setText(
        "freeDaysSince",
        freeDaysSince()
    );
}


/* =========================
   GREETING
========================= */

function updateGreeting() {
    const hour =
        appDate().getHours();

    let greeting;

    if (hour < 12) {
        greeting = "Good morning";
    }

    else if (hour < 17) {
        greeting = "Good afternoon";
    }

    else if (hour < 21) {
        greeting = "Good evening";
    }

    else {
        greeting = "Good night";
    }

    const name =
        localStorage.getItem(
            "caffTrackName"
        ) || "";

    const text =
        name
            ? `${greeting}, ${name}!`
            : `${greeting}!`;

    setText(
        "greeting",
        text
    );
}


/* =========================
   ENCOURAGEMENT
========================= */

function updateEncouragement() {
    const today =
        getDayData();

    const streak =
        caffeineFreeStreak();

    let message;

    if (streak >= 30) {
        message =
            "🏆 Thirty days. You've built something seriously strong.";
    }

    else if (streak >= 14) {
        message =
            "🔥 Two weeks caffeine-free. That's a huge milestone.";
    }

    else if (streak >= 7) {
        message =
            "🔥 Seven days. You've built a real habit.";
    }

    else if (streak >= 3) {
        message =
            "🌱 Three days. You're building momentum.";
    }

    else if (streak === 2) {
        message =
            "🔥 Two days down. Keep going.";
    }

    else if (streak === 1) {
        message =
            "🌱 Day one. One day at a time.";
    }

    else if (today.caffeine === 0) {
        message =
            "💙 No caffeine today. That's a win.";
    }

    else {
        message =
            "🌱 Keep tracking. Progress doesn't require perfection.";
    }

    setText(
        "encouragementText",
        message.replace(/^[^\p{L}\p{N}]+/u, "").trim()
    );
}


/* =========================
   WEEKLY CHART
========================= */

function renderChart() {
    const container =
        document.getElementById(
            "weeklyBars"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const days = [];

    for (let i = -6; i <= 0; i++) {
        const date =
            getDay(i);

        const key =
            dateKey(date);

        const value =
            data.days[key]?.caffeine ||
            0;

        days.push({
            date,
            key,
            value
        });
    }

// HOME: LAST 7 DAYS EMPTY STATE

const hasDrinksThisWeek = days.some(day => {
    const entries = data.days[day.key]?.entries;
    return Array.isArray(entries) && entries.length > 0;
});

if (!hasDrinksThisWeek) {
    const hasAnyHistory = Object.values(data.days).some(day =>
        Array.isArray(day?.entries) && day.entries.length > 0
    );

    const empty = document.createElement("div");
    empty.className = "weekly-chart-empty";

    const icon = document.createElement("div");
    icon.className = "weekly-chart-empty-icon";
    icon.textContent = "📊";

    const title = document.createElement("strong");
    title.textContent = hasAnyHistory
        ? "Nothing logged this week"
        : "Your journey starts here";

    const message = document.createElement("p");
    message.textContent = hasAnyHistory
        ? "No caffeine logged in the last 7 days. Log a drink to start a new weekly trend."
        : "Log your first drink to see your weekly caffeine trends.";

    empty.append(icon, title, message);
    container.appendChild(empty);

    return;
}

    const max =
        Math.max(
            400,
            ...days.map(
                day => day.value
            )
        );

    days.forEach(day => {
        const column =
            document.createElement(
                "div"
            );

        column.className =
            "bar-column";

        const bar =
            document.createElement(
                "div"
            );

        bar.className =
            "bar";

        if (
            day.key ===
            dateKey(appDate())
        ) {
            bar.classList.add(
                "today-bar"
            );
        }

        const height =
            day.value === 0
                ? 5
                : Math.max(
                    8,
                    (
                        day.value /
                        max
                    ) * 125
                );

        bar.style.height =
            height + "px";

        bar.title = `${day.date.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}: ${day.value} mg`;
        bar.tabIndex=0;
        bar.setAttribute('role','img');
        bar.setAttribute('aria-label',bar.title);
        const tooltip=document.createElement('span');
        tooltip.className='v15-bar-tip';
        tooltip.textContent=`${day.value} mg`;
        column.appendChild(tooltip);

        const label =
            document.createElement(
                "span"
            );

        label.textContent =
            day.key === dateKey(appDate())
                ? day.date.toLocaleDateString("en-US", {month:"numeric",day:"numeric"})
                : day.date
                .toLocaleDateString(
                    "en-US",
                    {
                        weekday: "short"
                    }
                )
                .charAt(0);

        column.appendChild(bar);
        column.appendChild(label);

        container.appendChild(column);
    });
}


/* =========================
   FREE DAYS
========================= */

function freeDays() {
    if (!hasCommitted()) {
        return 0;
    }

    const start =
        commitmentDate();

    const end =
        new Date(appDate());

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let total = 0;

    const cursor =
        new Date(start);

    while (cursor <= end) {
        const key =
            dateKey(cursor);

        const caffeine =
            Number(
                data.days[key]?.caffeine ||
                0
            );

        if (caffeine === 0) {
            total++;
        }

        cursor.setDate(
            cursor.getDate() + 1
        );
    }

    return total;
}


function freeDaysSince() {
    if (!hasCommitted()) {
        return "Not started";
    }

    const date =
        commitmentDate();

    return "Since " +
        date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
}


/* =========================
   STREAKS
========================= */

function caffeineFreeStreak() {
    if (!hasCommitted()) {
        return 0;
    }

    let streak = 0;

    const date =
        new Date(appDate());

    const start =
        commitmentDate();

    date.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    while (date >= start) {
        const key =
            dateKey(date);

        const day =
            data.days[key];

        if (
            day &&
            Number(day.caffeine) > 0
        ) {
            break;
        }

        streak++;

        date.setDate(
            date.getDate() - 1
        );
    }

    return streak;
}


function bestStreak() {
    if (!hasCommitted()) {
        return 0;
    }

    const start =
        commitmentDate();

    const end =
        new Date(appDate());

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let current = 0;
    let best = 0;

    const cursor =
        new Date(start);

    while (cursor <= end) {
        const key =
            dateKey(cursor);

        const caffeine =
            Number(
                data.days[key]?.caffeine ||
                0
            );

        if (caffeine === 0) {
            current++;
            best =
                Math.max(
                    best,
                    current
                );
        }

        else {
            current = 0;
        }

        cursor.setDate(
            cursor.getDate() + 1
        );
    }

    return best;
}


/* =========================
   WEEKLY TOTALS
========================= */

function sevenDayTotal() {
    let total = 0;

    for (let i = -6; i <= 0; i++) {
        const key =
            dateKey(
                getDay(i)
            );

        total +=
            Number(
                data.days[key]?.caffeine ||
                0
            );
    }

    return total;
}


function previousSevenDayTotal() {
    let total = 0;

    for (let i = -13; i <= -7; i++) {
        const key =
            dateKey(
                getDay(i)
            );

        total +=
            Number(
                data.days[key]?.caffeine ||
                0
            );
    }

    return total;
}


function weeklyAverage() {
    return Math.round(
        sevenDayTotal() / 7
    );
}


/* =========================
   HISTORY
========================= */

// History calculations begin at commitment, never on dates before tracking.
function historyTrackingStart() {
    const commitment = commitmentDate();
    if (commitment && !Number.isNaN(commitment.getTime())) {
        commitment.setHours(0, 0, 0, 0);
        return commitment;
    }
    const keys = Object.keys(data.days || {}).sort();
    return keys.length ? new Date(keys[0] + "T00:00:00") : new Date(appDate().getFullYear(), appDate().getMonth(), appDate().getDate());
}

function historyStartClamped(start) {
    const first = historyTrackingStart();
    return start < first ? new Date(first) : start;
}

function historyDaysSinceCommitment() {
    const commitment = commitmentDate();
    if (!commitment || Number.isNaN(commitment.getTime())) return 0;
    const now = appDate();
    const utcDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.max(0, Math.floor((utcDay(now) - utcDay(commitment)) / 86400000));
}

function canUseHistoryYear() {
    return Boolean(data.commitment) && historyDaysSinceCommitment() >= 365;
}

function updateHistoryYearAvailability() {
    const yearButton = document.querySelector('.history-range-button[data-range="year"]');
    if (yearButton) {
        const available = canUseHistoryYear();
        yearButton.disabled = !available;
        yearButton.setAttribute('aria-disabled', String(!available));
        yearButton.title = available ? 'Past 365 days' : 'Unlocks 365 days after your commitment';
    }
    if (historyRange === 'year' && !canUseHistoryYear()) {
        historyRange = 'week';
    }
    document.querySelectorAll('.history-range-button').forEach(button => {
        button.classList.toggle('active', button.dataset.range === historyRange);
    });
}

function isDateInHistoryRange(key) {
    const date =
        new Date(key + "T00:00:00");

    const today =
        new Date(appDate());

    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (date > today || date < historyTrackingStart()) {
        return false;
    }

    // WEEK — rolling 7 days
    if (historyRange === "week") {
        const start =
            new Date(today);

        start.setDate(
            start.getDate() - 6
        );

        return (
            date >= start &&
            date <= today
        );
    }

    // 30 DAYS — rolling 30 days
    if (historyRange === "month") {
        const start =
            new Date(today);

        start.setDate(
            start.getDate() - 29
        );

        return (
            date >= start &&
            date <= today
        );
    }

    // YEAR — rolling 365 days
    if (historyRange === "year") {
        const start =
            new Date(today);

        start.setDate(
            start.getDate() - 364
        );

        return (
            date >= start &&
            date <= today
        );
    }

    // ALL TIME
    return true;
}

function setHistoryRange(range) {
    if (
    range !== "week" &&
    range !== "month" &&
    range !== "year" &&
    range !== "all"
) {
        return;
    }

    if (range === "year" && !canUseHistoryYear()) return;

    historyRange = range;

    document
        .querySelectorAll(
            ".history-range-button"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.range === range
            );
        });

    renderHistory();

    refreshVisibleHistoryTrend();
}

function getHistoryRangeStats() {
    const today = new Date(appDate());
    today.setHours(0, 0, 0, 0);

    let start;
    let end = new Date(today);

    let previousStart = null;
    let previousEnd = null;

    let label = "";
    let title = "";

    if (historyRange === "week") {
        start = new Date(today);
        start.setDate(
            start.getDate() - 6
        );

        previousStart = new Date(today);
        previousStart.setDate(
            previousStart.getDate() - 13
        );

        previousEnd = new Date(today);
        previousEnd.setDate(
            previousEnd.getDate() - 7
        );

        label = "LAST 7 DAYS";
        title = "Last 7 days";
    }

    else if (historyRange === "month") {
    start = new Date(today);
    start.setDate(
        start.getDate() - 29
    );

    previousStart = new Date(today);
    previousStart.setDate(
        previousStart.getDate() - 59
    );

    previousEnd = new Date(today);
    previousEnd.setDate(
        previousEnd.getDate() - 30
    );

    label = "LAST 30 DAYS";
    title = "Last 30 days";
}

    else if (historyRange === "year") {
    start = new Date(today);
    start.setDate(
        start.getDate() - 364
    );

    previousStart = new Date(today);
    previousStart.setDate(
        previousStart.getDate() - 729
    );

    previousEnd = new Date(today);
    previousEnd.setDate(
        previousEnd.getDate() - 365
    );

    label = "LAST 365 DAYS";
    title = "Last 365 days";
}

    else {
        const commitment =
            commitmentDate();

        const historyKeys =
            Object.keys(data.days || {})
                .sort();

        if (commitment) {
            start =
                new Date(commitment);
        }

        else if (historyKeys.length > 0) {
            start =
                new Date(
                    historyKeys[0] +
                    "T00:00:00"
                );
        }

        else {
            start =
                new Date(today);
        }

        start.setHours(0, 0, 0, 0);

        label = "ALL TIME";
        title = "All time";
    }

    start = historyStartClamped(start);
    if (previousStart) previousStart = historyStartClamped(previousStart);

    function calculateStats(
        rangeStart,
        rangeEnd
    ) {
        if (
            !rangeStart ||
            !rangeEnd ||
            rangeStart > rangeEnd
        ) {
            return {
                total: 0,
                average: 0,
                freeDays: 0,
                days: 0
            };
        }

        let total = 0;
        let freeDays = 0;
        let days = 0;

        const cursor =
            new Date(rangeStart);

        while (cursor <= rangeEnd) {
            const key =
                dateKey(cursor);

            const caffeine =
                Number(
                    data.days[key]
                        ?.caffeine || 0
                );

            total += caffeine;

            if (caffeine === 0) {
                freeDays++;
            }

            days++;

            cursor.setDate(
                cursor.getDate() + 1
            );
        }

        return {
            total,
            average:
                days > 0
                    ? Math.round(
                        total / days
                    )
                    : 0,
            freeDays,
            days
        };
    }

    const current =
        calculateStats(
            start,
            end
        );

    const previous =
        previousStart &&
        previousEnd
            ? calculateStats(
                previousStart,
                previousEnd
            )
            : null;

    let comparison = "—";

  if (historyRange === "all") {
    const formattedStart =
        start.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    comparison =
        `Since you started tracking · ${formattedStart}`;
}
    else if (previous) {
        if (
            previous.total === 0 &&
            current.total === 0
        ) {
            comparison =
                "No change from previous period";
        }

        else if (previous.total === 0) {
            comparison =
                "No previous caffeine to compare";
        }

        else {
            const percent =
                Math.round(
                    (
                        (
                            current.total -
                            previous.total
                        ) /
                        previous.total
                    ) * 100
                );

            if (percent === 0) {
                comparison =
                    "No change from previous period";
            }

            else if (percent < 0) {
                comparison =
                    `${Math.abs(percent)}% lower than previous period`;
            }

            else {
                comparison =
                    `${percent}% higher than previous period`;
            }
        }
    }

    return {
        ...current,
        label,
        title,
        comparison
    };
}

function renderHistoryChart() {
    const container =
        document.getElementById(
            "historyChart"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const today =
        new Date(appDate());

    today.setHours(0, 0, 0, 0);

    let start;

    // =========================
    // RANGE
    // =========================

    if (historyRange === "week") {
        start = new Date(today);

        start.setDate(
            start.getDate() - 6
        );
    }

    else if (historyRange === "month") {
        start = new Date(today);

        start.setDate(
            start.getDate() - 29
        );
    }

    else if (historyRange === "year") {
        start = new Date(today);

        start.setDate(
            start.getDate() - 364
        );
    }

    else {
        const commitment =
            commitmentDate();

        const keys =
            Object.keys(data.days || {})
                .sort();

        if (commitment) {
            start =
                new Date(commitment);
        }

        else if (keys.length) {
            start =
                new Date(
                    keys[0] +
                    "T00:00:00"
                );
        }

        else {
            start =
                new Date(today);
        }
    }

    start = historyStartClamped(start);
    start.setHours(0, 0, 0, 0);


    // =========================
    // DAILY POINTS
    // =========================

    const points = [];

    const cursor =
        new Date(start);

    while (cursor <= today) {
        const key =
            dateKey(cursor);

        const day =
            data.days[key] || {};

        points.push({
            key,
            date:
                new Date(cursor),

            value:
                Number(
                    day.caffeine || 0
                ),

            entries:
                Array.isArray(
                    day.entries
                )
                    ? day.entries
                    : []
        });

        cursor.setDate(
            cursor.getDate() + 1
        );
    }

    if (!points.length) {
        return;
    }


    // =========================
    // SVG SETUP
    // =========================

    const width = 700;
    const height = 260;

    const padding = {
        top: 22,
        right: 18,
        bottom: 42,
        left: 46
    };

    const chartWidth =
        width -
        padding.left -
        padding.right;

    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    // =========================
    // Y AXIS
    // 25 MG INCREMENTS
    // =========================

    const actualMax =
        Math.max(
            ...points.map(
                point =>
                    point.value
            ),
            0
        );

    const yStep = 25;

    const yMax =
        Math.max(
            25,
            Math.ceil(
                actualMax /
                yStep
            ) * yStep
        );


    // =========================
    // POSITION HELPERS
    // =========================

    const xForIndex =
        index => {
            if (
                points.length === 1
            ) {
                return (
                    padding.left +
                    chartWidth / 2
                );
            }

            return (
                padding.left +
                (
                    index /
                    (
                        points.length -
                        1
                    )
                ) *
                chartWidth
            );
        };

    const yForValue =
        value =>
            padding.top +
            chartHeight -
            (
                value /
                yMax
            ) *
            chartHeight;


    // =========================
    // SVG
    // =========================

    const svgNS =
        "http://www.w3.org/2000/svg";

    const svg =
        document.createElementNS(
            svgNS,
            "svg"
        );

    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    svg.setAttribute(
        "class",
        "history-line-chart"
    );

    svg.setAttribute(
        "role",
        "img"
    );

    svg.setAttribute(
        "aria-label",
        "Caffeine trend"
    );


    // =========================
    // GRID
    // =========================

    const gridSteps =
        yMax / yStep;

    for (
        let i = 0;
        i <= gridSteps;
        i++
    ) {
        const value =
            yMax -
            yStep * i;

        const y =
            padding.top +
            (
                chartHeight /
                gridSteps
            ) * i;

        const line =
            document.createElementNS(
                svgNS,
                "line"
            );

        line.setAttribute(
            "x1",
            padding.left
        );

        line.setAttribute(
            "x2",
            width -
            padding.right
        );

        line.setAttribute(
            "y1",
            y
        );

        line.setAttribute(
            "y2",
            y
        );

        line.setAttribute(
            "class",
            "history-grid-line"
        );

        svg.appendChild(line);


        const text =
            document.createElementNS(
                svgNS,
                "text"
            );

        text.setAttribute(
            "x",
            padding.left - 9
        );

        text.setAttribute(
            "y",
            y + 4
        );

        text.setAttribute(
            "text-anchor",
            "end"
        );

        text.setAttribute(
            "class",
            "history-axis-label"
        );

        text.textContent =
            value;

        svg.appendChild(text);
    }


    // =========================
    // TREND LINE
    // =========================

    const path =
        document.createElementNS(
            svgNS,
            "path"
        );

    const pathData =
        points
            .map(
                (point, index) => {
                    const x =
                        xForIndex(index);

                    const y =
                        yForValue(
                            point.value
                        );

                    return (
                        index === 0
                            ? `M ${x} ${y}`
                            : `L ${x} ${y}`
                    );
                }
            )
            .join(" ");

    path.setAttribute(
        "d",
        pathData
    );

    path.setAttribute(
        "class",
        "history-trend-line"
    );

    svg.appendChild(path);


    // =========================
    // TOOLTIP
    // =========================

    const tooltip =
        document.createElement(
            "div"
        );

    tooltip.className =
        "history-chart-tooltip";

    container.appendChild(
        tooltip
    );


    function showTooltip(
        point,
        event
    ) {
        const date =
            point.date
                .toLocaleDateString(
                    "en-US",
                    {
                        weekday:
                            "short",
                        month:
                            "short",
                        day:
                            "numeric",
                        year:
                            "numeric"
                    }
                );

        const drinks =
            point.entries.length
                ? point.entries
                    .map(entry => `
                        <div class="history-tooltip-drink">
                            <span>
                                ${escapeHTML(
                                    entry.name ||
                                    "Caffeine"
                                )}
                            </span>

                            <strong>
                                ${Number(
                                    entry.amount || 0
                                )} mg
                            </strong>
                        </div>
                    `)
                    .join("")
                : `
                    <div class="history-tooltip-empty">
                        No caffeine logged
                    </div>
                `;

        tooltip.innerHTML = `
            <strong class="history-tooltip-date">
                ${date}
            </strong>

            ${drinks}

            <div class="history-tooltip-total">
                <span>Total</span>

                <strong>
                    ${point.value} mg
                </strong>
            </div>
        `;

        tooltip.classList.add(
            "visible"
        );

        positionTooltip(event);
    }


    function positionTooltip(event) {
        const rect =
            container
                .getBoundingClientRect();

        let left =
            event.clientX -
            rect.left +
            12;

        let top =
            event.clientY -
            rect.top -
            10;

        const tooltipWidth =
            tooltip.offsetWidth;

        const tooltipHeight =
            tooltip.offsetHeight;

        if (
            left +
            tooltipWidth >
            rect.width - 6
        ) {
            left =
                event.clientX -
                rect.left -
                tooltipWidth -
                12;
        }

        if (top < 6) {
            top = 6;
        }

        if (
            top +
            tooltipHeight >
            rect.height - 6
        ) {
            top =
                rect.height -
                tooltipHeight -
                6;
        }

        tooltip.style.left =
            left + "px";

        tooltip.style.top =
            top + "px";
    }


    function hideTooltip() {
        tooltip.classList.remove(
            "visible"
        );
    }


    // =========================
    // DATA POINTS
    // =========================

    points.forEach(
        (point, index) => {
            const x =
                xForIndex(index);

            const y =
                yForValue(
                    point.value
                );

            const circle =
                document.createElementNS(
                    svgNS,
                    "circle"
                );

            circle.setAttribute(
                "cx",
                x
            );

            circle.setAttribute(
                "cy",
                y
            );

            circle.setAttribute(
                "r",
                point.value > 0
                    ? "4.5"
                    : "3"
            );

            circle.setAttribute(
                "class",
                point.value > 0
                    ? "history-trend-point"
                    : "history-trend-point history-zero-point"
            );

            circle.addEventListener(
                "mouseenter",
                event => {
                    showTooltip(
                        point,
                        event
                    );
                }
            );

            circle.addEventListener(
                "mousemove",
                event => {
                    positionTooltip(
                        event
                    );
                }
            );

            circle.addEventListener(
                "mouseleave",
                hideTooltip
            );

            // Touch / mobile
            circle.addEventListener(
                "click",
                event => {
                    event.stopPropagation();

                    showTooltip(
                        point,
                        event
                    );
                }
            );

            svg.appendChild(
                circle
            );
        }
    );


    // =========================
    // X AXIS LABELS
    // =========================

    let desiredLabels;

    if (
        historyRange === "week"
    ) {
        desiredLabels = 7;
    }

    else if (
        historyRange === "month"
    ) {
        desiredLabels = 6;
    }

    else {
        desiredLabels = 7;
    }


    const labelIndexes =
        new Set();

    labelIndexes.add(0);

    labelIndexes.add(
        points.length - 1
    );


    if (points.length > 2) {
        const intervals =
            Math.max(
                1,
                desiredLabels - 1
            );

        for (
            let i = 1;
            i < intervals;
            i++
        ) {
            const index =
                Math.round(
                    (
                        i /
                        intervals
                    ) *
                    (
                        points.length -
                        1
                    )
                );

            labelIndexes.add(
                index
            );
        }
    }


    [...labelIndexes]
        .sort(
            (a, b) =>
                a - b
        )
        .forEach(index => {
            const point =
                points[index];

            const x =
                xForIndex(index);

            const text =
                document.createElementNS(
                    svgNS,
                    "text"
                );

            text.setAttribute(
                "x",
                x
            );

            text.setAttribute(
                "y",
                height - 13
            );

            text.setAttribute(
                "text-anchor",
                "middle"
            );

            text.setAttribute(
                "class",
                "history-axis-label history-x-label"
            );


            if (
                historyRange === "all"
            ) {
                text.textContent =
                    point.date
                        .toLocaleDateString(
                            "en-US",
                            {
                                month:
                                    "numeric",
                                day:
                                    "numeric",
                                year:
                                    "2-digit"
                            }
                        );
            }

            else {
                text.textContent =
                    point.date
                        .toLocaleDateString(
                            "en-US",
                            {
                                month:
                                    "numeric",
                                day:
                                    "numeric"
                            }
                        );
            }


            svg.appendChild(
                text
            );
        });


    container.appendChild(svg);


    // Clicking outside a point
    // closes the mobile tooltip.
    svg.addEventListener(
        "click",
        event => {
            if (
                event.target.tagName
                    .toLowerCase() !==
                "circle"
            ) {
                hideTooltip();
            }
        }
    );
}

function toggleHistoryTrend() {
    const panel =
        document.getElementById(
            "historyTrendPanel"
        );

    const button =
        document.getElementById(
            "historyTrendButton"
        );

    const arrow =
        document.getElementById(
            "historyTrendArrow"
        );

    if (!panel || !button || !arrow) {
        return;
    }

    const willOpen =
        panel.classList.contains("hidden");

    panel.classList.toggle(
        "hidden",
        !willOpen
    );

    button.setAttribute("aria-expanded", String(willOpen));

    const text =
        button.querySelector("span:first-child");

    if (text) {
        text.textContent =
            willOpen
                ? "Hide Trend"
                : "See Trend";
    }

    arrow.textContent =
        willOpen
            ? "↑"
            : "↓";

if (willOpen) {
    renderHistoryChart();
}
}

/* Redraw a restored, expanded Trend after History becomes visible. */
function refreshVisibleHistoryTrend() {
    const page = document.getElementById("historyPage");
    const section = document.getElementById("historyTrendSection");
    const content = section?.querySelector(".history-fold-content");
    if (!page || page.classList.contains("hidden") ||
        !content || content.hidden) return;
    requestAnimationFrame(() => {
        if (!page.classList.contains("hidden") && !content.hidden) {
            renderHistoryChart();
        }
    });
}

/* =========================
   COLLAPSIBLE HISTORY SECTIONS
========================= */

const HISTORY_FOLD_KEY = "caffTrackHistorySections";

function getHistoryFoldSettings() {
    try {
        return JSON.parse(
            localStorage.getItem(HISTORY_FOLD_KEY) || "{}"
        );
    } catch {
        return {};
    }
}

function setupCollapsibleHistory() {
    const settings = getHistoryFoldSettings();

    const sections = [
        {
            id: "trend",
            selector: "#historyChart",
            title: "Caffeine Trend",
            subtitle: "See how your caffeine intake changes over time",
            defaultOpen: false
        },
        {
            id: "weekday",
            selector: ".weekday-insights-card",
            title: "Day of the Week",
            subtitle: "Your habits Monday through Sunday",
            defaultOpen: false
        },
        {
            id: "timeofday",
            selector: ".time-insights-card",
            title: "Time of Day",
            subtitle: "When you usually log caffeine",
            defaultOpen: false
        },
        {
            id: "mostdrinks",
            selector: ".drink-insights-card",
            title: "Most Logged Drinks",
            subtitle: "Your most common drinks",
            defaultOpen: false
        },
        {
            id: "entries",
            selector: "#historyList",
            title: "Logged Drinks",
            subtitle: "View and edit your history",
            defaultOpen: true
        }
    ];

    sections.forEach(config => {
        const target = document.querySelector(config.selector);
        const section = target?.closest("section");

        if (!section || section.dataset.foldReady === "true") {
            return;
        }

        section.dataset.foldReady = "true";

        const isOpen =
            typeof settings[config.id] === "boolean"
                ? settings[config.id]
                : config.defaultOpen;

        const existingChildren = Array.from(section.children);

        // Move the existing content into a collapsible body.
        const content = document.createElement("div");
        content.className = "history-fold-content";

        existingChildren.forEach(child => {
            content.appendChild(child);
        });

        // Create the clickable section header.
        const header = document.createElement("button");
        header.type = "button";
        header.className = "history-fold-header";
        header.setAttribute("aria-expanded", String(isOpen));

        const heading = document.createElement("span");
        heading.className = "history-fold-heading";

        const title = document.createElement("strong");
        title.textContent = config.title;

        const subtitle = document.createElement("small");
        subtitle.textContent = config.subtitle;

        heading.append(title, subtitle);

        const arrow = document.createElement("span");
        arrow.className = "history-fold-arrow";
        arrow.innerHTML = '<span class="history-chevron"></span>';

        header.append(heading, arrow);

        section.classList.add("history-fold-section");
        section.append(header, content);

        // Hide the original heading, now duplicated by the header.
        const originalHeading = content.querySelector(
            ":scope > h2, :scope > .section-heading"
        );

        const originalEyebrow = content.querySelector(
            ":scope > .eyebrow"
        );

        if (originalHeading) {
            originalHeading.classList.add("history-fold-original-heading");
        }

        if (originalEyebrow) {
            originalEyebrow.classList.add("history-fold-original-heading");
        }

        // This period note is inside the collapsible body, never above the cards.
        const periodNote = document.createElement("div");
        periodNote.className = "v154-period-note";
        periodNote.setAttribute("aria-label", "Selected History time period");
        const periodPrefix = document.createElement("span");
        periodPrefix.textContent = "Showing";
        const periodValue = document.createElement("strong");
        periodValue.className = "v154-period-value";
        periodNote.append(periodPrefix, periodValue);
        periodValue.textContent = ({week:"Past 7 days",month:"Past 30 days",year:"Past 365 days",all:"All time"})[historyRange] || "Selected period";
        content.prepend(periodNote);
        content.hidden = !isOpen;

        header.addEventListener("click", () => {
            const willOpen = content.hidden;

            content.hidden = !willOpen;

            if (config.id === "trend" && willOpen) {
                renderHistoryChart();
            }

            header.setAttribute(
                "aria-expanded",
                String(willOpen)
            );

            const latest = getHistoryFoldSettings();
            latest[config.id] = willOpen;

            localStorage.setItem(
                HISTORY_FOLD_KEY,
                JSON.stringify(latest)
            );
        });
    });

    // Preserve the existing Caffeine Trend toggle.
    const trendButton = document.getElementById(
        "historyTrendButton"
    );

    const trendPanel = document.getElementById(
        "historyTrendPanel"
    );

    if (trendButton && trendPanel) {
        // Restore the previous open state.
        if (
            settings.trend === true &&
            trendPanel.classList.contains("hidden")
        ) {
            toggleHistoryTrend();
        }

        trendButton.addEventListener("click", () => {
            const latest = getHistoryFoldSettings();

            latest.trend = !trendPanel.classList.contains(
                "hidden"
            );

            localStorage.setItem(
                HISTORY_FOLD_KEY,
                JSON.stringify(latest)
            );
        });
    }
}

/* =========================
   MOST LOGGED DRINKS
========================= */

let drinkInsightsMode = "count";

function setDrinkInsightsMode(mode) {
    if (!["count", "caffeine"].includes(mode)) return;

    drinkInsightsMode = mode;

    document.querySelectorAll(".drink-insights-mode")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });

    renderMostLoggedDrinks();
}

function renderMostLoggedDrinks() {
    const container =
        document.getElementById("mostLoggedDrinks");

    if (!container) return;

    const drinks = new Map();

    Object.entries(data.days || {}).forEach(([key, day]) => {
        if (!isDateInHistoryRange(key)) return;
        if (!Array.isArray(day.entries)) return;

        day.entries.forEach(entry => {
            const name = String(
                entry.name || "Caffeine"
            ).trim() || "Caffeine";

            const normalized = name.toLowerCase();
            const amount = Number(entry.amount) || 0;

            if (!drinks.has(normalized)) {
                drinks.set(normalized, {
                    name,
                    count: 0,
                    caffeine: 0
                });
            }

            const drink = drinks.get(normalized);
            drink.count++;
            drink.caffeine += amount;
        });
    });

    const metric = drinkInsightsMode;
    const ranked = [...drinks.values()]
        .sort((a, b) =>
            b[metric] - a[metric] ||
            a.name.localeCompare(b.name)
        )
        .slice(0, 10);

    container.replaceChildren();

   if (!ranked.length) {
    showHistoryEmptyState(
        container,
        "Log a drink to discover which ones you enjoy most."
    );
    return;
}

    const totalLogs = [...drinks.values()].reduce((sum, d) => sum + d.count, 0);
    const totalMg = [...drinks.values()].reduce((sum, d) => sum + d.caffeine, 0);
    const denominator = Math.max(1, metric === "count" ? totalLogs : totalMg);

    ranked.forEach(drink => {
        const row = document.createElement("div");
        row.className = "drink-insights-row";

        const heading = document.createElement("div");
        heading.className = "drink-insights-heading";

        const name = document.createElement("strong");
        name.textContent = drink.name;

        const value = document.createElement("span");
        value.textContent = metric === "count"
            ? `${drink.count} ${drink.count === 1 ? "time" : "times"} · ${Math.round(drink.count / denominator * 100)}%`
            : `${drink.caffeine.toLocaleString()} mg · ${Math.round(drink.caffeine / denominator * 100)}%`;

        heading.append(name, value);

        const track = document.createElement("div");
        track.className = "drink-insights-track";

        const bar = document.createElement("div");
        bar.className = "drink-insights-bar";
        bar.style.width =
            `${(drink[metric] / denominator) * 100}%`;

        track.appendChild(bar);
        row.append(heading, track);
        container.appendChild(row);
    });
}
/* =========================
   TIME OF DAY INSIGHTS
========================= */

let timeInsightsMode = "count";

function setTimeInsightsMode(mode) {
    if (!["count", "caffeine"].includes(mode)) return;

    timeInsightsMode = mode;

    document.querySelectorAll(".time-insights-mode")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });

    renderTimeOfDayInsights();
}

function renderTimeOfDayInsights() {
    const container = document.getElementById("timeOfDayInsights");
    if (!container) return;
    container.replaceChildren();
    const slots = Array.from({length:48}, () => ({count:0,caffeine:0}));
    let totalCount = 0;
    Object.entries(data.days || {}).forEach(([key,day]) => {
        if (!isDateInHistoryRange(key)) return;
        (day.entries || []).forEach(entry => {
            const slot = v15EntrySlot(entry);
            if (slot === null || slot < 0 || slot > 47) return;
            slots[slot].count++;
            slots[slot].caffeine += Number(entry.amount) || 0;
            totalCount++;
        });
    });
    if (!totalCount) {
        showHistoryEmptyState(container,"Log drinks to discover what time you usually have caffeine.");
        return;
    }
    // Display only the useful span; one hour of context on either side.
    const active = slots.map((bin,i)=>bin.count ? i : -1).filter(i=>i>=0);
    const firstHour = Math.max(0, Math.floor(active[0]/2)-1);
    const lastHour = Math.min(24, Math.floor(active[active.length-1]/2)+2);
    const metric = timeInsightsMode;
    const plot = document.createElement("div");
    plot.className = "v154-hourly-plot";
    plot.setAttribute("role","img");
    plot.setAttribute("aria-label", `Caffeine ${metric==='count'?'drink counts':'amounts'} by half-hour, from ${v154HourLabel(firstHour)} to ${v154HourLabel(lastHour)}`);
    const visible = slots.slice(firstHour*2, lastHour*2);
    const max = Math.max(1,...visible.map(bin=>bin[metric]));
    const bars = document.createElement("div");
    bars.className = "v154-hourly-bars";
    visible.forEach((bin,i) => {
        const slot = firstHour*2+i;
        const column = document.createElement("div");
        column.className = "v154-hourly-column";
        const bar = document.createElement("div");
        bar.className = "v154-hourly-bar";
        bar.style.height = `${bin[metric] ? Math.max(6,bin[metric]/max*100) : 0}%`;
        column.style.setProperty(
    "--bar-height",
    `${bin[metric] ? Math.max(6, bin[metric] / max * 100) : 0}%`
);


if (bin[metric] > 0) {
    const amountLabel = document.createElement("span");
    amountLabel.className = "v154-caffeine-amount";

    amountLabel.textContent =
        metric === "caffeine"
            ? `${bin.caffeine} mg`
            : `${bin.count}`;

    column.appendChild(amountLabel);
}


        bar.title = `${v15ClockText(slot)} — ${metric==='count'?`${bin.count} drink${bin.count===1?'':'s'}`:`${bin.caffeine} mg`}`;
        bar.tabIndex = 0;
        bar.setAttribute("aria-label",bar.title);
        column.appendChild(bar);
        bars.appendChild(column);
    });
    plot.appendChild(bars);
    const axis = document.createElement("div");
    axis.className = "v154-hourly-axis";
    // Labels are evenly positioned at actual hour boundaries.
    const hours = lastHour-firstHour;
    const step = hours > 12 ? 3 : hours > 7 ? 2 : 1;
    for(let hour=firstHour;hour<=lastHour;hour+=step) {
        const tick = document.createElement("span");
        tick.textContent = v154HourLabel(hour);
        tick.style.left = `${((hour-firstHour)*2+0.5)/(hours*2)*100}%`;
        axis.appendChild(tick);
    }
    if ((lastHour-firstHour)%step !== 0) {
        const last = document.createElement("span");last.textContent=v154HourLabel(lastHour);
        last.style.left="calc(100% - 1px)";;axis.appendChild(last);
    }
    plot.appendChild(axis);
    container.appendChild(plot);
    const hint=document.createElement("p");hint.className="v154-chart-help";
    hint.textContent="Select a bar to see the amount at that time · Each bar is 30 minutes";
    container.appendChild(hint);
}
function v154HourLabel(hour) {
    if(hour===24)return "12 AM";
    return `${hour%12 || 12} ${hour<12?'AM':'PM'}`;
}

/* =========================
   DAY OF WEEK INSIGHTS
========================= */

let weekdayInsightsMode = "caffeine";

function setWeekdayInsightsMode(mode) {
    if (!["caffeine", "count"].includes(mode)) return;

    weekdayInsightsMode = mode;

    document.querySelectorAll(".weekday-insights-mode")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );
        });

    renderWeekdayInsights();
}

function renderWeekdayInsights() {
    const container = document.getElementById("weekdayInsights");
    if (!container) return;

    const weekdays = [
        { label: "Monday", caffeine: 0, count: 0, days: 0 },
        { label: "Tuesday", caffeine: 0, count: 0, days: 0 },
        { label: "Wednesday", caffeine: 0, count: 0, days: 0 },
        { label: "Thursday", caffeine: 0, count: 0, days: 0 },
        { label: "Friday", caffeine: 0, count: 0, days: 0 },
        { label: "Saturday", caffeine: 0, count: 0, days: 0 },
        { label: "Sunday", caffeine: 0, count: 0, days: 0 }
    ];

    // Use the same date range as History.
    const today = new Date(appDate());
    today.setHours(0, 0, 0, 0);

    let start = new Date(today);

    if (historyRange === "week") {
        start.setDate(start.getDate() - 6);
    } else if (historyRange === "month") {
        start.setDate(start.getDate() - 29);
    } else if (historyRange === "year") {
        start.setDate(start.getDate() - 364);
    } else {
        start = historyTrackingStart();
    }
    start = historyStartClamped(start);

    // Count every calendar day, including caffeine-free days.
    const cursor = new Date(start);

    while (cursor <= today) {
        const key = dateKey(cursor);
        const index = (cursor.getDay() + 6) % 7;
        const weekday = weekdays[index];

        weekday.days++;

        const day = data.days[key];

        if (day) {
            weekday.caffeine += Number(day.caffeine) || 0;
            weekday.count += Array.isArray(day.entries)
                ? day.entries.length
                : Number(day.drinks) || 0;
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    const metric = weekdayInsightsMode;

    const values = weekdays.map(day =>
        metric === "caffeine"
            ? day.caffeine / Math.max(day.days, 1)
            : day.count
    );

    const max = Math.max(1, ...values);
container.replaceChildren();

const hasLoggedCaffeine = weekdays.some(
    day => day.caffeine > 0 || day.count > 0
);

if (!hasLoggedCaffeine) {
    showHistoryEmptyState(
        container,
        "Start logging caffeine to discover which days you drink the most."
    );
    return;
}

const chart = document.createElement("div");
chart.className = "v154-weekday-chart";
chart.setAttribute("aria-label",metric === 'caffeine' ? 'Average caffeine by weekday' : 'Total drinks logged by weekday');
weekdays.forEach((day,index) => {
    const value=values[index];
    const col=document.createElement("div");col.className="v154-weekday-col";
    const number=document.createElement("span");number.className="v154-weekday-value";
    number.textContent=metric==='caffeine'?`${Math.round(value)} mg`:`${day.count}`;
    // Narrow screens display the number only; the full mg value stays accessible.
    number.dataset.mobileValue=metric==='caffeine'?String(Math.round(value)):String(day.count);
    const plot=document.createElement("div");plot.className="v154-weekday-track";
    const bar=document.createElement("div");bar.className="v154-weekday-bar";
    bar.style.height=`${value ? Math.max(5,value/max*100) : 0}%`;
    bar.title=`${day.label}: ${metric==='caffeine'?`${Math.round(value)} mg/day`:`${day.count} drinks`} (across ${day.days} days)`;
    bar.tabIndex=0;bar.setAttribute("aria-label",bar.title);
    plot.appendChild(bar);
    const label=document.createElement("span");label.className="v154-weekday-label";
    label.textContent=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][index];
    col.append(number,plot,label);chart.appendChild(col);
});
container.appendChild(chart);
const footer=document.createElement('p');footer.className='v154-chart-help';
footer.textContent=metric==='caffeine'?'Average mg per calendar day, including caffeine-free days':'Total drinks on each weekday in the selected period';
container.appendChild(footer);
}

/* =========================
   INSIGHTS SUMMARY
========================= */

function renderInsightsSummary() {
    const drinks = new Map();
    const periods = {
        morning: 0,
        afternoon: 0,
        night: 0
    };

    const weekdays = [
        { name: "Sunday", caffeine: 0, days: 0 },
        { name: "Monday", caffeine: 0, days: 0 },
        { name: "Tuesday", caffeine: 0, days: 0 },
        { name: "Wednesday", caffeine: 0, days: 0 },
        { name: "Thursday", caffeine: 0, days: 0 },
        { name: "Friday", caffeine: 0, days: 0 },
        { name: "Saturday", caffeine: 0, days: 0 }
    ];

    const today = new Date(appDate());
    today.setHours(0, 0, 0, 0);

    const recordedDates = Object.keys(data.days || {})
        .filter(key => isDateInHistoryRange(key))
        .sort();

    let start = new Date(today);

    if (historyRange === "week") {
        start.setDate(start.getDate() - 6);
    } else if (historyRange === "month") {
        start.setDate(start.getDate() - 29);
    } else if (historyRange === "year") {
        start.setDate(start.getDate() - 364);
    } else if (recordedDates.length) {
        start = new Date(recordedDates[0] + "T00:00:00");
    }

    start = historyStartClamped(start);
    const hasHistory = recordedDates.length > 0;

    if (hasHistory) {
        // Include caffeine-free days in weekday averages.
        const cursor = new Date(start);

        while (cursor <= today) {
            const key = dateKey(cursor);
            const weekday = weekdays[cursor.getDay()];
            const day = data.days[key];

            weekday.days++;
            weekday.caffeine += Number(day?.caffeine) || 0;

            cursor.setDate(cursor.getDate() + 1);
        }
    }

    let totalDrinks = 0;
    let classifiedDrinks = 0;

    recordedDates.forEach(key => {
        const day = data.days[key];

        if (!Array.isArray(day?.entries)) return;

        day.entries.forEach(entry => {
            totalDrinks++;

            const name = String(entry.name || "Caffeine")
                .trim() || "Caffeine";

            const normalized = name.toLowerCase();

            if (!drinks.has(normalized)) {
                drinks.set(normalized, { name, count: 0 });
            }

            drinks.get(normalized).count++;

            const time = Number.isInteger(entry.timeSlot) ? v15Period(entry.timeSlot) : String(entry.timeOfDay || "")
                .toLowerCase();

            if (Object.hasOwn(periods, time)) {
                periods[time]++;
                classifiedDrinks++;
            }
        });
    });

    // Favorite drink
    const favorite = [...drinks.values()]
        .sort((a, b) =>
            b.count - a.count ||
            a.name.localeCompare(b.name)
        )[0];

    setText(
        "insightFavoriteDrink",
        favorite?.name || "—"
    );

    setText(
        "insightFavoriteDetail",
        favorite
            ? `${favorite.count} ${favorite.count === 1 ? "time" : "times"} logged`
            : "No drinks yet"
    );

    // Peak weekday, based on average mg per calendar day.
    const peak = weekdays
        .filter(day => day.days > 0)
        .sort((a, b) =>
            (b.caffeine / b.days) -
            (a.caffeine / a.days)
        )[0];

    const peakAverage = peak
        ? Math.round(peak.caffeine / peak.days)
        : 0;

    setText(
        "insightPeakDay",
        peak && peakAverage > 0 ? peak.name : "—"
    );

    setText(
        "insightPeakDayDetail",
        peak && peakAverage > 0
            ? `${peakAverage} mg/day average`
            : "No caffeine recorded"
    );

    // Most common time of day
    const labels = {
        morning: "Morning",
        afternoon: "Afternoon",
        night: "Night"
    };

    const commonTime = Object.entries(periods)
        .sort((a, b) => b[1] - a[1])[0];

    const commonCount = commonTime?.[1] || 0;

    setText(
        "insightCommonTime",
        commonCount > 0 ? labels[commonTime[0]] : "—"
    );

    setText(
        "insightCommonTimeDetail",
        commonCount > 0
            ? `${Math.round(commonCount / classifiedDrinks * 100)}% of categorized drinks`
            : totalDrinks > 0
                ? "No time categories yet"
                : "No drinks yet"
    );
}

/* =========================
   HISTORY EMPTY STATES
========================= */

function showHistoryEmptyState(container, message) {
    if (!container) return;

    container.replaceChildren();

    const empty = document.createElement("div");
    empty.className = "history-empty-state";

    const icon = document.createElement("div");
    icon.className = "history-empty-icon";
    icon.textContent = "📊";

    const title = document.createElement("strong");
    title.textContent = "Nothing to show just yet";

    const description = document.createElement("p");
    description.textContent = message;

    empty.append(icon, title, description);
    container.appendChild(empty);
}

function renderHistory() {
    updateHistoryYearAvailability();
    const periodName = ({week:"Past 7 days",month:"Past 30 days",year:"Past 365 days",all:"All time"})[historyRange] || "Selected period";
    document.querySelectorAll(".v154-period-value").forEach(el => { el.textContent = periodName; });
    renderMostLoggedDrinks();
    renderTimeOfDayInsights();
    renderWeekdayInsights();
    renderInsightsSummary();

    const stats =
        getHistoryRangeStats();

    setText(
        "historyRangeLabel",
        stats.label
    );

    setText(
        "historyRangeTotal",
        stats.total
    );

    setText(
        "historyRangeAverage",
        stats.average
    );

    setText(
        "historyRangeFreeDays",
        stats.freeDays
    );

    setText(
        "historyComparison",
        stats.comparison
    );

    setText(
        "historyTrendTitle",
        stats.title
    );

    setText(
        "historyEntriesTitle",
        stats.title
    );

    const container =
        document.getElementById(
            "historyList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const keys =
    Object.keys(data.days)
        .filter(key => {
            const day =
                data.days[key];

            const hasHistory =
                Number(
                    day.caffeine || 0
                ) > 0 ||
                (
                    Array.isArray(
                        day.entries
                    ) &&
                    day.entries.length > 0
                );

            return (
                hasHistory &&
                isDateInHistoryRange(key)
            );
        })
        .sort()
        .reverse();

    if (keys.length === 0) {
    showHistoryEmptyState(
        container,
        "No drinks logged for this period. Try another date range or log your first drink."
    );
    return;
}

    keys.forEach(key => {
        const day =
            data.days[key];

        const date =
            new Date(
                key + "T00:00:00"
            );

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "history-day";

        const dateLabel =
            date.toLocaleDateString(
                "en-US",
                {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(historyRange === "all"
        ? { year: "numeric" }
        : {})
}
            );

        row.innerHTML = `
            <div class="history-left">

                <div class="history-icon">
                    ☕
                </div>

                <div class="history-info">

                    <strong>
                        ${dateLabel}
                    </strong>

                    <small>
                        ${day.drinks || 0}
                        ${
                            Number(day.drinks) === 1
                                ? "drink"
                                : "drinks"
                        }
                    </small>

                </div>

            </div>

            <div class="history-right">

                <strong>
                    ${Number(day.caffeine || 0)} mg
                </strong>

                <small>
                    total
                </small>

            </div>
        `;

        if (
            Array.isArray(day.entries) &&
            day.entries.length > 0
        ) {
            const drinkList =
                document.createElement(
                    "div"
                );

            drinkList.className =
                "history-drinks";

            day.entries.forEach(entry => {
                const drink =
                    document.createElement(
                        "div"
                    );

                drink.className =
                    "history-drink";

                const timeLabels = {
                    morning:
                        "☀️ Morning",

                    afternoon:
                        "🌤️ Afternoon",

                    night:
                        "🌙 Night"
                };

                const slot = v15EntrySlot(entry);
                const timeLabel = slot===null ? '' : v15ClockText(slot);

                drink.innerHTML = `
                    <div>

                        <strong>
                            ${escapeHTML(
                                entry.name ||
                                "Caffeine"
                            )}
                        </strong>

                        <small>
                            ${Number(
                                entry.amount || 0
                            )} mg${entry.ounces ? ` · ${entry.ounces} oz` : ''}${entry.flavor ? ` · ${escapeHTML(entry.flavor)}` : ''}
                            ${
                                timeLabel
                                    ? " · " +
                                      timeLabel
                                    : ""
                            }
                        </small>

                    </div>

                    <div class="history-actions">

                        <button
                            class="edit-button"
                            type="button"
                            onclick="editDrink(
                                '${key}',
                                '${String(
                                    entry.id
                                )}'
                            )"
                        >
                            Edit
                        </button>

                        <button
                            class="remove-button"
                            type="button"
                            onclick="removeDrink(
                                '${key}',
                                '${String(
                                    entry.id
                                )}'
                            )"
                            aria-label="Remove drink"
                        >
                            ×
                        </button>

                    </div>
                `;

                drinkList.appendChild(
                    drink
                );
            });

            row.appendChild(
                drinkList
            );
        }

        container.appendChild(
            row
        );
    });
}


/* =========================
   PROGRESS
========================= */

/* =========================
   PERSONAL RECORDS
========================= */

function getPersonalRecords() {
    const start =
        commitmentDate();

    const today =
        new Date(appDate());

    today.setHours(
        0,
        0,
        0,
        0
    );

    if (!start) {
        return {
            longestStreak: null,
            lowest7: null,
            lowest30: null,
            mostFreeDays: null,
            biggestReduction: null
        };
    }

    start.setHours(
        0,
        0,
        0,
        0
    );


    // =========================
    // BUILD DAILY HISTORY
    // =========================

    const days = [];

    const cursor =
        new Date(start);

    while (cursor <= today) {
        const key =
            dateKey(cursor);

        days.push({
            date:
                new Date(cursor),

            caffeine:
                Number(
                    data.days[key]
                        ?.caffeine || 0
                )
        });

        cursor.setDate(
            cursor.getDate() + 1
        );
    }


    // =========================
    // LONGEST FREE STREAK
    // =========================

    let currentStreak = 0;
    let longestStreak = 0;

    days.forEach(day => {
        if (day.caffeine === 0) {
            currentStreak++;

            longestStreak =
                Math.max(
                    longestStreak,
                    currentStreak
                );
        }

        else {
            currentStreak = 0;
        }
    });


    // =========================
    // LOWEST 7-DAY AVERAGE
    // =========================

    let lowest7 = null;

    if (days.length >= 7) {
        for (
            let i = 0;
            i <= days.length - 7;
            i++
        ) {
            const window =
                days.slice(
                    i,
                    i + 7
                );

            const total =
                window.reduce(
                    (sum, day) =>
                        sum +
                        day.caffeine,
                    0
                );

            const average =
                total / 7;

            if (
                lowest7 === null ||
                average < lowest7
            ) {
                lowest7 = average;
            }
        }

        lowest7 =
            Math.round(lowest7);
    }


    // =========================
    // 30-DAY RECORDS
    // =========================

    let lowest30 = null;
    let mostFreeDays = null;

    if (days.length >= 30) {
        mostFreeDays = 0;

        for (
            let i = 0;
            i <= days.length - 30;
            i++
        ) {
            const window =
                days.slice(
                    i,
                    i + 30
                );

            const total =
                window.reduce(
                    (sum, day) =>
                        sum +
                        day.caffeine,
                    0
                );

            const average =
                total / 30;

            if (
                lowest30 === null ||
                average < lowest30
            ) {
                lowest30 =
                    average;
            }


            const freeDays =
                window.filter(
                    day =>
                        day.caffeine === 0
                ).length;

            mostFreeDays =
                Math.max(
                    mostFreeDays,
                    freeDays
                );
        }

        lowest30 =
            Math.round(lowest30);
    }


    // =========================
    // BIGGEST 7-DAY REDUCTION
    // =========================

    let biggestReduction = null;

    if (days.length >= 14) {
        biggestReduction = 0;

        for (
            let i = 7;
            i <= days.length - 7;
            i += 7
        ) {
            const previous =
                days.slice(
                    i - 7,
                    i
                );

            const current =
                days.slice(
                    i,
                    i + 7
                );

            if (
                current.length < 7
            ) {
                continue;
            }

            const previousTotal =
                previous.reduce(
                    (sum, day) =>
                        sum +
                        day.caffeine,
                    0
                );

            const currentTotal =
                current.reduce(
                    (sum, day) =>
                        sum +
                        day.caffeine,
                    0
                );

            const reduction =
                previousTotal -
                currentTotal;

            if (
                reduction >
                biggestReduction
            ) {
                biggestReduction =
                    reduction;
            }
        }
    }


    return {
        longestStreak,
        lowest7,
        lowest30,
        mostFreeDays,
        biggestReduction
    };
}


function renderPersonalRecords() {
    const records =
        getPersonalRecords();


    setText(
        "recordLongestStreak",
        records.longestStreak ??
        "—"
    );


    setText(
        "recordLowest7",
        records.lowest7 ??
        "—"
    );


    setText(
        "recordLowest30",
        records.lowest30 ??
        "—"
    );


    setText(
        "recordMostFreeDays",
        records.mostFreeDays ??
        "—"
    );


    setText(
        "recordBiggestReduction",
        records.biggestReduction ??
        "—"
    );
}

function daysSinceCommitment() {
    const start =
        commitmentDate();

    if (!start) {
        return 0;
    }

    const today =
        new Date(appDate());

    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const difference =
        Math.floor(
            (today - start) /
            86400000
        );

    return Math.max(
        0,
        difference
    );
}

function renderProgress() {
    const totalLogged =
        Object.values(data.days)
            .reduce(
                (total, day) =>
                    total +
                    Number(
                        day.caffeine || 0
                    ),
                0
            );

    const previous =
        previousSevenDayTotal();

    const current =
        sevenDayTotal();

    let change = "—";

    if (
        previous === 0 &&
        current === 0
    ) {
        change = "0%";
    }

    else if (
        previous === 0 &&
        current > 0
    ) {
        change = "New";
    }

    else if (previous > 0) {
        const difference =
            Math.round(
                (
                    (
                        current -
                        previous
                    ) /
                    previous
                ) * 100
            );

        change =
            difference === 0
                ? "0%"
                : (
                    difference > 0
                        ? "+" + difference + "%"
                        : difference + "%"
                );
    }

    setText(
        "progressStreak",
        caffeineFreeStreak()
    );

    setText(
        "bestStreak",
        bestStreak()
    );

    setText(
        "progressFreeDays",
        freeDays()
    );

    setText(
        "weeklyAverage",
        weeklyAverage()
    );

    setText(
        "totalLogged",
        totalLogged
    );

    setText(
        "weeklyChange",
        change
    );

    renderMilestones();

    setText(
    "daysSinceCommitment",
    daysSinceCommitment()
);

const committed =
    commitmentDate();

setText(
    "progressCommitmentDate",
    committed
        ? committed.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        )
        : "—"
);
}


/* =========================
   MILESTONES
========================= */

function renderMilestones() {
    const container =
        document.getElementById(
            "milestones"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const milestones = [
        [1, "First caffeine-free day"],
        [2, "2 caffeine-free days"],
        [3, "3 caffeine-free days"],
        [7, "7 caffeine-free days"],
        [14, "14 caffeine-free days"],
        [30, "30 caffeine-free days"]
    ];

    milestones.forEach(item => {
        const complete =
            freeDays() >= item[0];

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "milestone" +
            (
                complete
                    ? " complete"
                    : ""
            );

        row.innerHTML = `
            <div class="milestone-check">
                ${
                    complete
                        ? "✓"
                        : item[0]
                }
            </div>

            <div>
                <strong>
                    ${item[1]}
                </strong>

                <small>
                    ${
                        complete
                            ? "Completed"
                            : "Keep going"
                    }
                </small>
            </div>
        `;

        container.appendChild(row);
    });
}


/* =========================
   DEV MODE
========================= */

function isLocalVersion() {
    return (
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1"
    );
}


function setupDevMode() {
    const devButton =
        document.getElementById(
            "devButton"
        );

    const devPanel =
        document.getElementById(
            "devPanel"
        );

    if (!isLocalVersion()) {
        if (devButton) {
            devButton.remove();
        }

        if (devPanel) {
            devPanel.remove();
        }

        return;
    }

    updateDev();
}


function toggleDev() {
    if (!isLocalVersion()) {
        return;
    }

    const panel =
        document.getElementById(
            "devPanel"
        );

    if (!panel) {
        return;
    }

    panel.style.display =
        panel.style.display === "block"
            ? "none"
            : "block";

    updateDev();
}


function changeDevDay(amount) {
    if (!isLocalVersion()) {
        return;
    }

    const date =
        appDate();

    date.setDate(
        date.getDate() + amount
    );

    devDate = date;

    updateApp();
}


function resetDev() {
    if (!isLocalVersion()) {
        return;
    }

    devDate = null;

    updateApp();
}

function updateCommitmentDateDisplay() {
    const display =
        document.getElementById(
            "commitmentDateDisplay"
        );

    if (!display) {
        return;
    }

    const date =
        commitmentDate();

    if (!date) {
        display.textContent = "—";
        return;
    }

    display.textContent =
        date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
}


function changeDevCommitmentDate() {
    if (!isLocalVersion()) {
        return;
    }

    const input =
        document.getElementById(
            "devCommitmentDate"
        );

    if (
        !input ||
        !input.value
    ) {
        return;
    }

    const selected =
        new Date(
            input.value +
            "T00:00:00"
        );

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    if (selected > today) {
        alert(
            "Commitment date can't be in the future."
        );

        return;
    }

    data.commitment =
        input.value;

    saveData();

    updateApp();
}

function updateDev() {
    const date =
        document.getElementById(
            "devDate"
        );

    if (date) {
        date.textContent =
            appDate().toLocaleDateString(
                "en-US",
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            );
    }

    const commitmentInput =
        document.getElementById(
            "devCommitmentDate"
        );

    if (commitmentInput) {
        commitmentInput.value =
            data.commitment || "";

        commitmentInput.max =
            dateKey(new Date());
    }
}


/* =========================
   SETTINGS
========================= */

function exportData() {
    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement(
            "a"
        );

    link.href = url;

    link.download =
        "cafftrack-backup.json";

    link.click();

    URL.revokeObjectURL(url);
}


function importData(file) {
    if (!file) {
        return;
    }

    const reader =
        new FileReader();

    reader.onload =
        event => {
            try {
                const imported =
                    JSON.parse(
                        event.target.result
                    );

                if (
                    !imported ||
                    typeof imported !== "object" ||
                    !imported.days ||
                    typeof imported.days !== "object"
                ) {
                    throw new Error(
                        "Invalid data"
                    );
                }

                if (
                    !Object.prototype
                        .hasOwnProperty
                        .call(
                            imported,
                            "commitment"
                        )
                ) {
                    imported.commitment =
                        null;
                }

                data =
                    imported;

                normalizeData();

                saveData();

                updateApp();

                if (!hasCommitted()) {
                    showCommitment();
                }

                alert(
                    "CaffTrack data restored."
                );
            }

            catch {
                alert(
                    "That file could not be imported."
                );
            }
        };

    reader.readAsText(file);
}


function openResetModal() {
    const modal =
        document.getElementById(
            "resetModal"
        );

    const resetDrinks =
        document.getElementById(
            "resetMyDrinks"
        );

    if (resetDrinks) {
        resetDrinks.checked = false;
    }

    if (modal) {
        modal.classList.add("active");
    }
}


function closeResetModal() {
    const modal =
        document.getElementById(
            "resetModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }
}


function confirmResetData() {
    const resetDrinks =
        document.getElementById(
            "resetMyDrinks"
        );

    const shouldResetDrinks =
        resetDrinks &&
        resetDrinks.checked;

    const savedDrinks =
        shouldResetDrinks
            ? []
            : [...getMyDrinks()];


    data = {
        days: {},
        commitment: null,
        myDrinks: savedDrinks
    };


    localStorage.removeItem(
        "caffTrackName"
    );


    saveData();


    const nameInput =
        document.getElementById(
            "nameInput"
        );

    if (nameInput) {
        nameInput.value = "";
    }


    const commitmentName =
        document.getElementById(
            "commitmentName"
        );

    if (commitmentName) {
        commitmentName.value = "";
    }


    closeResetModal();

    updateApp();

    showCommitment();

    alert(
        shouldResetDrinks
            ? "CaffTrack and My Drinks have been reset."
            : "CaffTrack has been reset. My Drinks were kept."
    );
}


/* =========================
   APPEARANCE
========================= */

function applyAppearance(mode) {
    document.body.classList.remove(
        "dark-mode"
    );

    if (mode === "dark") {
        document.body.classList.add(
            "dark-mode"
        );

        return;
    }

    if (
        mode === "system" &&
        window.matchMedia &&
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
    ) {
        document.body.classList.add(
            "dark-mode"
        );
    }
}


function changeAppearance(mode) {
    localStorage.setItem(
        "caffTrackAppearance",
        mode
    );

    applyAppearance(mode);
}


function loadAppearance() {
    const mode =
        localStorage.getItem(
            "caffTrackAppearance"
        ) || "system";

    applyAppearance(mode);

    const select =
        document.getElementById(
            "appearanceSelect"
        );

    if (select) {
        select.value = mode;
    }
}


function setupSystemAppearanceListener() {
    if (!window.matchMedia) {
        return;
    }

    const media =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        );

    media.addEventListener(
        "change",
        () => {
            const mode =
                localStorage.getItem(
                    "caffTrackAppearance"
                ) || "system";

            if (mode === "system") {
                applyAppearance(
                    "system"
                );
            }
        }
    );
}


/* =========================
   PERSONALIZATION
========================= */

function saveName(name) {
    name = name.trim();

    localStorage.setItem(
        "caffTrackName",
        name
    );

    const nameInput =
        document.getElementById("nameInput");

    if (nameInput) {
        nameInput.value = name;
    }

    updateGreeting();
}


function loadName() {
    const name =
        localStorage.getItem(
            "caffTrackName"
        ) || "";

    const input =
        document.getElementById(
            "nameInput"
        );

    if (input) {
        input.value = name;
    }

    updateGreeting();
}


function commitWithName() {
    const input =
        document.getElementById(
            "commitmentName"
        );

    const name =
        input.value.trim();

    if (!name) {
        input.focus();

        input.placeholder =
            "Please enter your name";

        return;
    }

    saveName(name);

    commitToQuit();
}


/* =========================
   DATA NORMALIZATION
========================= */

function normalizeData() {
    if (
        !data ||
        typeof data !== "object"
    ) {
        data = {
            days: {},
            commitment: null,
            myDrinks: []
        };
    }

    if (!Array.isArray(data.myDrinks)) {
        data.myDrinks = [];
    }

    if (
        !data.days ||
        typeof data.days !== "object"
    ) {
        data.days = {};
    }

    if (
        !Object.prototype
            .hasOwnProperty
            .call(
                data,
                "commitment"
            )
    ) {
        data.commitment = null;
    }

    Object.keys(data.days)
        .forEach(key => {
            const day =
                data.days[key];

            if (
                !day ||
                typeof day !== "object"
            ) {
                data.days[key] = {
                    caffeine: 0,
                    drinks: 0,
                    entries: []
                };

                return;
            }

            if (
                !Array.isArray(
                    day.entries
                )
            ) {
                day.entries = [];
            }

            day.entries.forEach(
                entry => {
                    if (!entry.id) {
                        entry.id =
                            Date.now()
                                .toString() +
                            Math.random();
                    }

                    entry.name =
                        String(
                            entry.name ||
                            "Caffeine"
                        );

                    entry.amount =
                        Number(
                            entry.amount ||
                            0
                        );

                    if (
                        ![
                            "morning",
                            "afternoon",
                            "night"
                        ].includes(
                            entry.timeOfDay
                        )
                    ) {
                        delete entry.timeOfDay;
                    }
                }
            );

            if (
                day.entries.length > 0
            ) {
                day.caffeine =
                    day.entries.reduce(
                        (
                            total,
                            entry
                        ) =>
                            total +
                            Number(
                                entry.amount ||
                                0
                            ),
                        0
                    );

                day.drinks =
                    day.entries.length;
            }

            else {
                day.caffeine =
                    Number(
                        day.caffeine ||
                        0
                    );

                day.drinks =
                    Number(
                        day.drinks ||
                        0
                    );
            }
        });
}


/* =========================
   HELPERS
========================= */

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================
   MY DRINKS
========================= */

let myDrinksSort = "recent";
let historyRange = "week";


function getMyDrinks() {
    if (!Array.isArray(data.myDrinks)) {
        data.myDrinks = [];
    }

    return data.myDrinks;
}


function openNewSavedDrink() {
    const modal =
        document.getElementById("savedDrinkModal");

    const nameInput =
        document.getElementById("savedDrinkName");

    const amountInput =
        document.getElementById("savedDrinkAmount");

    if (!modal) {
        return;
    }

    if (nameInput) {
        nameInput.value = "";
    }

    if (amountInput) {
        amountInput.value = "";
    }

    modal.classList.add("active");
    document.getElementById('savedDrinkOunces').value='';
    chooseDrinkColor('savedDrink','blue');

    setTimeout(() => {
        if (nameInput) {
            nameInput.focus();
        }
    }, 100);
}


function closeNewSavedDrink() {
    const modal =
        document.getElementById("savedDrinkModal");

    if (modal) {
        modal.classList.remove("active");
    }
}


function saveNewDrink() {
    const nameInput =
        document.getElementById("savedDrinkName");

    const amountInput =
        document.getElementById("savedDrinkAmount");

    const name =
        nameInput
            ? nameInput.value.trim()
            : "";

    const amount =
        amountInput
            ? Number(amountInput.value)
            : 0;

    if (!name) {
        alert("Please enter a drink name.");

        if (nameInput) {
            nameInput.focus();
        }

        return;
    }

    if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > MAX_CAFFEINE_PER_DRINK
) {
    alert(
        "Caffeine must be a whole number between 1 and 999 mg."
    );

    if (amountInput) {
        amountInput.focus();
    }

    return;
}

    const drinks =
        getMyDrinks();

    const duplicate =
        drinks.find(drink =>
            drink.name
                .trim()
                .toLowerCase() ===
            name.toLowerCase()
        );

    if (duplicate) {
        alert(
            `"${duplicate.name}" is already in My Drinks.`
        );

        return;
    }

    const ounces=v15Ounces('savedDrink');if(ounces===false)return;
    drinks.push({
        color:v15SelectedColors.savedDrink,
        ounces:ounces,
        id:
            Date.now().toString() +
            Math.random(),

        name:
            name,

        amount:
            amount,

        createdAt:
            Date.now()
    });

    saveData();

    closeNewSavedDrink();

    renderMyDrinks();
}


function getDrinkUsageCount(drink) {
    let count = 0;

    Object
        .values(data.days || {})
        .forEach(day => {
            if (!Array.isArray(day.entries)) {
                return;
            }

            day.entries.forEach(entry => {
                if (
                    String(entry.name || "")
                        .trim()
                        .toLowerCase() ===
                    drink.name
                        .trim()
                        .toLowerCase()
                ) {
                    count++;
                }
            });
        });

    return count;
}


function getDrinkLastUsed(drink) {
    let latest = 0;

    Object
        .entries(data.days || {})
        .forEach(([dayKey, day]) => {
            if (!Array.isArray(day.entries)) {
                return;
            }

            const used =
                day.entries.some(entry =>
                    String(entry.name || "")
                        .trim()
                        .toLowerCase() ===
                    drink.name
                        .trim()
                        .toLowerCase()
                );

            if (used) {
                const timestamp =
                    new Date(
                        dayKey + "T12:00:00"
                    ).getTime();

                latest =
                    Math.max(
                        latest,
                        timestamp
                    );
            }
        });

    return latest;
}


function setMyDrinksSort(sort) {
    myDrinksSort = sort;

    document
        .querySelectorAll(
            ".my-drinks-sort-button"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.sort === sort
            );
        });

    renderMyDrinks();
}


/* Flavor notes belong to individual log entries, not My Drinks templates. */
function flavorCountsForDrink(name) {
    const counts = new Map();
    Object.values(data.days || {}).forEach(day => {
        (day.entries || []).forEach(entry => {
            if (normalizeDrinkName(entry.name) !== normalizeDrinkName(name)) return;
            const flavor = String(entry.flavor || '').trim() || 'Unspecified';
            const key = flavor.toLocaleLowerCase();
            const old = counts.get(key);
            if (old) old.count++;
            else counts.set(key, {name:flavor, count:1});
        });
    });
    return [...counts.values()].sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name));
}
function renderFlavorBreakdown(drink) {
    const counts = flavorCountsForDrink(drink.name);
    if (!counts.length) return '';
    const total = counts.reduce((n,x)=>n+x.count,0);
    const id = 'flavors-' + String(drink.id).replace(/[^a-zA-Z0-9_-]/g,'');
    return `<details class="drink-flavor-breakdown" id="${id}"><summary>Flavor breakdown <span>${total} logs</span></summary><div class="flavor-breakdown-inner">${counts.map(x=>`<div class="flavor-count-row"><div><span>${escapeHTML(x.name)}</span><strong>${x.count}</strong></div><div class="flavor-count-bar"><span style="width:${x.count/total*100}%"></span></div></div>`).join('')}</div></details>`;
}
function matchingFlavorSuggestions(name, query) {
    const matching = new Map();
    Object.values(data.days || {}).forEach(day => (day.entries || []).forEach(entry => {
        const flavor = String(entry.flavor || '').trim();
        if (!flavor || normalizeDrinkName(entry.name) !== normalizeDrinkName(name)) return;
        if (!flavor.toLocaleLowerCase().includes(query.toLocaleLowerCase())) return;
        const key=flavor.toLocaleLowerCase();
        matching.set(key,{name:flavor,count:(matching.get(key)?.count || 0)+1});
    }));
    return [...matching.values()].sort((a,b)=>b.count-a.count).slice(0,6);
}
function hideFlavorSuggestions() {
    document.querySelectorAll('.flavor-suggestions').forEach(el=>el.classList.add('hidden'));
    document.querySelectorAll('.flavor-input').forEach(el=>el.setAttribute('aria-expanded','false'));
}
function showFlavorSuggestions(id) {
    hideFlavorSuggestions();
    const input=document.getElementById(id);
    const dropdown=document.getElementById(id+'Suggestions');
    const name=document.getElementById(id==='logFlavor'?'drinkName':'editDrinkName')?.value || '';
    if (!input || !dropdown || document.activeElement !== input) return;
    const suggestions=matchingFlavorSuggestions(name,input.value.trim());
    if (!suggestions.length) return;
    dropdown.innerHTML='<div class="flavor-suggestions-heading">PREVIOUS FLAVORS</div>'+suggestions.map(({name,count},i)=>`<button type="button" role="option" data-flavor-index="${i}"><span>${escapeHTML(name)}</span><small>${count} logged</small></button>`).join('');
    dropdown.querySelectorAll('[data-flavor-index]').forEach((button,i)=>button.addEventListener('click',()=>{
        input.value=suggestions[i].name;hideFlavorSuggestions();input.focus();
    }));
    dropdown.classList.remove('hidden');input.setAttribute('aria-expanded','true');
}
document.addEventListener('pointerdown', event=>{
    if (!event.target.closest('.flavor-field')) hideFlavorSuggestions();
    if (!event.target.closest('.drink-picker')) hideDrinkSuggestions();
});

function renderMyDrinks() {
    const container =
        document.getElementById("myDrinksList");

    if (!container) {
        return;
    }

    const searchInput =
        document.getElementById(
            "myDrinksSearch"
        );

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    let drinks =
        [...getMyDrinks()];

    if (search) {
        drinks =
            drinks.filter(drink =>
                drink.name
                    .toLowerCase()
                    .includes(search)
            );
    }

    if (myDrinksSort === "az") {
        drinks.sort(
            (a, b) =>
                a.name.localeCompare(b.name)
        );
    }

    else if (myDrinksSort === "used") {
        drinks.sort(
            (a, b) =>
                getDrinkUsageCount(b) -
                getDrinkUsageCount(a)
        );
    }

    else {
        drinks.sort(
            (a, b) => {
                const lastUsedDifference =
                    getDrinkLastUsed(b) -
                    getDrinkLastUsed(a);

                if (lastUsedDifference !== 0) {
                    return lastUsedDifference;
                }

                return (
                    Number(b.createdAt || 0) -
                    Number(a.createdAt || 0)
                );
            }
        );
    }

    if (!drinks.length) {
        container.innerHTML = `
            <div class="my-drinks-empty">
                <strong>
                    ${search
                        ? "No matching drinks"
                        : "No saved drinks yet"}
                </strong>

                <p>
                    ${search
                        ? "Try another search."
                        : "Tap + to add your first drink."}
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        drinks
            .map(drink => {
                const count =
                    getDrinkUsageCount(drink);

                const usageText =
                    count === 1
                        ? "1 time logged"
                        : `${count} times logged`;

                return `
                    <div class="my-drink-card">

                        <div class="my-drink-bolt v15-custom-can" style="--drink-tint:${V15_COLORS[drink.color] || (/alani/i.test(drink.name) ? V15_COLORS.purple : V15_COLORS.blue)}"><span class="v142-can-illustration" aria-hidden="true"><span class="v142-can-stripe"></span></span></div>

                        <div class="my-drink-info">

                            <strong>
                                ${escapeHTML(drink.name)}
                            </strong>

                            <span>
                                ${Number(drink.amount)} mg${drink.ounces ? ` · ${drink.ounces} oz` : ''}
                                · ${usageText}
                            </span>

                        </div>

                        <div class="my-drink-actions">

                            <button
                                class="my-drink-log-button"
                                type="button"
                                onclick="logSavedDrink('${drink.id}')"
                            >
                                Log
                            </button>

                            <div class="my-drink-menu-wrap">

                                <button
                                    class="my-drink-menu-button"
                                    type="button"
                                    onclick="toggleMyDrinkMenu('${drink.id}', event)"
                                    aria-label="Drink options"
                                >
                                    ⋯
                                </button>

                                <div
                                    id="myDrinkMenu-${drink.id}"
                                    class="my-drink-menu hidden"
                                >

                                    <button
    type="button"
    onclick="openEditSavedDrink('${drink.id}')"
>
    Edit Drink
</button>

<button
    type="button"
    onclick="openMergeDrink('${drink.id}')"
>
    Merge Drink
</button>

<button
    class="danger"
    type="button"
    onclick="removeSavedDrink('${drink.id}')"
>
    Remove from My Drinks
</button>

                                </div>

                            </div>

                        </div>
                        ${renderFlavorBreakdown(drink)}
                    </div>
                `;
            })
            .join("");
}


function closeMyDrinkMenus() {
    document
        .querySelectorAll(".my-drink-menu")
        .forEach(menu =>
            menu.classList.add("hidden")
        );
}


function toggleMyDrinkMenu(id, event) {
    if (event) {
        event.stopPropagation();
    }

    const menu =
        document.getElementById(
            `myDrinkMenu-${id}`
        );

    if (!menu) {
        return;
    }

    const wasOpen =
        !menu.classList.contains("hidden");

    closeMyDrinkMenus();

    if (wasOpen) {
        return;
    }

    menu.classList.remove("open-up");
    menu.classList.remove("hidden");

    const menuRect =
        menu.getBoundingClientRect();

    const nav =
        document.querySelector(
            ".bottom-nav"
        );

    const navTop =
        nav
            ? nav.getBoundingClientRect().top
            : window.innerHeight;

    const spaceBelow =
        navTop - menuRect.top;

    if (spaceBelow < menuRect.height + 10) {
        menu.classList.add("open-up");
    }
}


function removeSavedDrink(id) {
    const drink =
        getMyDrinks().find(item =>
            String(item.id) === String(id)
        );

    if (!drink) {
        return;
    }

    const confirmed =
        confirm(
            `Remove "${drink.name}" from My Drinks?\n\nYour previous logged drinks will stay in History.`
        );

    if (!confirmed) {
        return;
    }

    data.myDrinks =
        getMyDrinks().filter(item =>
            String(item.id) !== String(id)
        );

    saveData();

    renderMyDrinks();
}

let mergeSourceDrinkId = null;


function openMergeDrink(id) {
    const source =
        getMyDrinks().find(drink =>
            String(drink.id) === String(id)
        );

    if (!source) {
        return;
    }

    const otherDrinks =
        getMyDrinks().filter(drink =>
            String(drink.id) !== String(id)
        );

    if (!otherDrinks.length) {
        alert(
            "You need at least two drinks in My Drinks to merge."
        );

        return;
    }

    mergeSourceDrinkId = id;

    closeMyDrinkMenus();

    const sourceName =
        document.getElementById(
            "mergeSourceDrinkName"
        );

    const targetSelect =
        document.getElementById(
            "mergeTargetDrink"
        );

    const amountChoice =
        document.getElementById(
            "mergeKeepAmounts"
        );

    if (sourceName) {
        sourceName.textContent =
            source.name;
    }

    if (targetSelect) {
        targetSelect.innerHTML =
            otherDrinks
                .sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
                .map(drink => `
                    <option value="${escapeHTML(drink.id)}">
                        ${escapeHTML(drink.name)}
                        — ${Number(drink.amount)} mg
                    </option>
                `)
                .join("");
    }

    if (amountChoice) {
        amountChoice.checked = true;
    }

    const modal =
        document.getElementById(
            "mergeDrinkModal"
        );

    if (modal) {
        modal.classList.add("active");
    }
}


function closeMergeDrink() {
    const modal =
        document.getElementById(
            "mergeDrinkModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }

    mergeSourceDrinkId = null;
}


function confirmMergeDrink() {
    const source =
        getMyDrinks().find(drink =>
            String(drink.id) ===
            String(mergeSourceDrinkId)
        );

    const targetSelect =
        document.getElementById(
            "mergeTargetDrink"
        );

    if (!source || !targetSelect) {
        return;
    }

    const target =
        getMyDrinks().find(drink =>
            String(drink.id) ===
            String(targetSelect.value)
        );

    if (!target) {
        return;
    }

    const keepAmounts =
        document.getElementById(
            "mergeKeepAmounts"
        )?.checked ?? true;

    const sourceName =
        normalizeDrinkName(source.name);

    let changedEntries = 0;

    Object.values(data.days || {})
        .forEach(day => {
            if (!Array.isArray(day.entries)) {
                return;
            }

            let dayChanged = false;

            day.entries.forEach(entry => {
                if (
                    normalizeDrinkName(entry.name) ===
                    sourceName
                ) {
                    entry.name =
                        target.name;

                    if (!keepAmounts) {
                        entry.amount =
                            Number(target.amount);
                    }

                    changedEntries++;
                    dayChanged = true;
                }
            });

            if (dayChanged) {
                day.caffeine =
                    day.entries.reduce(
                        (total, entry) =>
                            total +
                            Number(entry.amount || 0),
                        0
                    );

                day.drinks =
                    day.entries.length;
            }
        });

    data.myDrinks =
        getMyDrinks().filter(drink =>
            String(drink.id) !==
            String(source.id)
        );

    saveData();

    closeMergeDrink();

    updateApp();

    renderMyDrinks();

    alert(
        `"${source.name}" was merged into "${target.name}".\n\n` +
        `${changedEntries} History ${
            changedEntries === 1
                ? "entry was"
                : "entries were"
        } updated.`
    );
}

function openEditSavedDrink(id) {
    const drink =
        getMyDrinks().find(item =>
            String(item.id) === String(id)
        );

    if (!drink) {
        return;
    }

    closeMyDrinkMenus();

    document.getElementById(
        "editSavedDrinkId"
    ).value = drink.id;

    document.getElementById(
        "editSavedDrinkName"
    ).value = drink.name;

    document.getElementById(
        "editSavedDrinkAmount"
    ).value = drink.amount;
    document.getElementById('editSavedDrinkOunces').value=drink.ounces??'';
    chooseDrinkColor('editSavedDrink',Object.hasOwn(V15_COLORS,drink.color)?drink.color:'blue');

    document
        .getElementById(
            "editSavedDrinkModal"
        )
        .classList.add("active");
}


function closeEditSavedDrink() {
    const modal =
        document.getElementById(
            "editSavedDrinkModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }
}


function saveEditedSavedDrink() {
    const id =
        document.getElementById(
            "editSavedDrinkId"
        ).value;

    const name =
        document.getElementById(
            "editSavedDrinkName"
        ).value.trim();

    const amount =
        Number(
            document.getElementById(
                "editSavedDrinkAmount"
            ).value
        );

    if (!name) {
        alert("Enter a drink name.");
        return;
    }

    if (
    !Number.isInteger(amount) ||
    amount < 1 ||
    amount > MAX_CAFFEINE_PER_DRINK
) {
    alert(
        "Caffeine must be a whole number between 1 and 999 mg."
    );

    return;
}

    const duplicate =
        getMyDrinks().some(drink =>
            String(drink.id) !== String(id) &&
            normalizeDrinkName(drink.name) ===
            normalizeDrinkName(name)
        );

    if (duplicate) {
        alert(
            "You already have a drink with that name."
        );
        return;
    }

    const drink =
        getMyDrinks().find(item =>
            String(item.id) === String(id)
        );

    if (!drink) {
        return;
    }

    const oldName =
    normalizeDrinkName(drink.name);

const nameChanged =
    oldName !== normalizeDrinkName(name);

if (nameChanged) {
    Object.values(data.days || {})
        .forEach(day => {
            if (!Array.isArray(day.entries)) {
                return;
            }

            day.entries.forEach(entry => {
                if (
                    normalizeDrinkName(entry.name) ===
                    oldName
                ) {
                    entry.name = name;
                }
            });
        });
}

const ounces=v15Ounces('editSavedDrink');if(ounces===false)return;
drink.name = name;
drink.amount = amount;
drink.ounces=ounces;
drink.color=v15SelectedColors.editSavedDrink;

saveData();

closeEditSavedDrink();

updateApp();

renderMyDrinks();
}

function logSavedDrink(id) {
    const drink =
        getMyDrinks()
            .find(item =>
                String(item.id) ===
                String(id)
            );

    if (!drink) {
        return;
    }

    openLogger();

    const nameInput =
        document.getElementById("drinkName");

    if (nameInput) {
        nameInput.value =
            drink.name;
    }

    selectAmount(drink.amount);
    v15FillLoggerFromDrink(drink);
}

/* =========================
   DRINK PICKER
========================= */

function addHistoryDrinksToMyDrinks() {
    if (data.historyDrinksMigrated) {
        return;
    }

    const drinks = getMyDrinks();

    const existingNames =
        new Set(
            drinks.map(drink =>
                normalizeDrinkName(drink.name)
            )
        );

    const historyDrinks = new Map();

    Object.entries(data.days || {})
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([dayKey, day]) => {
            if (!Array.isArray(day.entries)) {
                return;
            }

            [...day.entries]
                .reverse()
                .forEach(entry => {
                    const name =
                        String(entry.name || "").trim();

                    const normalized =
                        normalizeDrinkName(name);

                    const amount =
                        Number(entry.amount);

                    if (
                        !normalized ||
                        historyDrinks.has(normalized) ||
                        !Number.isInteger(amount) ||
                        amount < 1 ||
                        amount > MAX_CAFFEINE_PER_DRINK
                    ) {
                        return;
                    }

                    historyDrinks.set(
                        normalized,
                        {
                            name,
                            amount
                        }
                    );
                });
        });

    let added = false;

    historyDrinks.forEach(
        (drink, normalized) => {
            if (existingNames.has(normalized)) {
                return;
            }

            drinks.push({
                id:
                    Date.now().toString() +
                    Math.random(),

                name:
                    drink.name,

                amount:
                    drink.amount,

                createdAt:
                    Date.now()
            });

            existingNames.add(normalized);
            added = true;
        }
    );

    data.historyDrinksMigrated = true;

saveData();
}

function normalizeDrinkName(name) {
    return String(name || "")
        .trim()
        .toLowerCase();
}


function getRecentDrinks(limit = 5) {
    const recent = [];
    const seen = new Set();

    const days =
        Object.entries(data.days || {})
            .sort(
                ([a], [b]) =>
                    b.localeCompare(a)
            );

    days.forEach(([dayKey, day]) => {
        if (!Array.isArray(day.entries)) {
            return;
        }

        [...day.entries]
            .reverse()
            .forEach(entry => {
                const normalized =
                    normalizeDrinkName(entry.name);

                if (
                    !normalized ||
                    seen.has(normalized)
                ) {
                    return;
                }

                seen.add(normalized);

                const savedDrink =
                    getMyDrinks().find(drink =>
                        normalizeDrinkName(
                            drink.name
                        ) === normalized
                    );

                recent.push({
                    id:
                        savedDrink
                            ? savedDrink.id
                            : null,

                    name:
                        savedDrink
                            ? savedDrink.name
                            : entry.name,

                    amount:
                        savedDrink
                            ? savedDrink.amount
                            : Number(
                                entry.amount || 0
                            )
                });
            });
    });

    return recent.slice(0, limit);
}

function updateSaveToMyDrinksOption() {
    const input =
        document.getElementById("drinkName");

    const option =
        document.getElementById(
            "saveToMyDrinksOption"
        );

    const checkbox =
        document.getElementById(
            "saveToMyDrinks"
        );

    if (!input || !option || !checkbox) {
        return;
    }

    const name =
        input.value.trim();

    if (!name) {
        option.classList.add("hidden");
        checkbox.checked = false;
        return;
    }

    const alreadySaved =
        getMyDrinks().some(drink =>
            normalizeDrinkName(drink.name) ===
            normalizeDrinkName(name)
        );

    if (alreadySaved) {
        option.classList.add("hidden");
        checkbox.checked = false;
    }

    else {
        option.classList.remove("hidden");
        checkbox.checked = true;
    }
}

function showDrinkSuggestions() {
    const input =
        document.getElementById("drinkName");

    const dropdown =
        document.getElementById(
            "drinkSuggestions"
        );

    if (!input || !dropdown) {
        return;
    }

    const query =
        normalizeDrinkName(input.value);

    let drinks = [];
    let heading = "";

    if (!query) {
        heading = "RECENTLY USED";

        drinks =
            getRecentDrinks();
    }

    else {
        heading = "MY DRINKS";

        const saved =
            getMyDrinks();

        const startsWith =
            saved.filter(drink =>
                normalizeDrinkName(
                    drink.name
                ).startsWith(query)
            );

        const includes =
            saved.filter(drink => {
                const name =
                    normalizeDrinkName(
                        drink.name
                    );

                return (
                    !name.startsWith(query) &&
                    name.includes(query)
                );
            });

        drinks = [
            ...startsWith,
            ...includes
        ];
    }


    if (!drinks.length) {
        dropdown.classList.add("hidden");
        dropdown.innerHTML = "";
        return;
    }


    dropdown.innerHTML = `
        <div class="drink-suggestions-heading">
            ${heading}
        </div>

        ${drinks.map(drink => `
            <button
                class="drink-suggestion"
                type="button"
                onclick="selectDrinkSuggestion(
                    '${drink.id || ""}',
                    '${encodeURIComponent(drink.name)}',
                    ${Number(drink.amount)}
                )"
            >

                <span>
                    ${escapeHTML(drink.name)}
                </span>

                <strong>
                    ${Number(drink.amount)} mg
                </strong>

            </button>
        `).join("")}

        <button
            class="view-my-drinks"
            type="button"
            onclick="openMyDrinksFromPicker()"
        >
            View My Drinks →
        </button>
    `;

    dropdown.classList.remove("hidden");
}

function showDrinkSuggestions() {
    const input =
        document.getElementById("drinkName");

    const dropdown =
        document.getElementById(
            "drinkSuggestions"
        );

    if (!input || !dropdown) {
        return;
    }

    const query =
        normalizeDrinkName(input.value);

    let drinks = [];
    let heading = "";

    if (!query) {
        heading = "RECENTLY USED";

        drinks =
            getRecentDrinks();
    }

    else {
        heading = "MY DRINKS";

        const saved =
            getMyDrinks();

        const startsWith =
            saved.filter(drink =>
                normalizeDrinkName(
                    drink.name
                ).startsWith(query)
            );

        const includes =
            saved.filter(drink => {
                const name =
                    normalizeDrinkName(
                        drink.name
                    );

                return (
                    !name.startsWith(query) &&
                    name.includes(query)
                );
            });

        drinks = [
            ...startsWith,
            ...includes
        ];
    }

    updateSaveToMyDrinksOption();

    if (!drinks.length) {
        dropdown.classList.add("hidden");
        dropdown.innerHTML = "";
        return;
    }

    dropdown.innerHTML = `
        <div class="drink-suggestions-heading">
            ${heading}
        </div>

        ${drinks.map(drink => `
            <button
                class="drink-suggestion"
                type="button"
                onclick="selectDrinkSuggestion(
                    '${drink.id || ""}',
                    '${encodeURIComponent(drink.name)}',
                    ${Number(drink.amount)}
                )"
            >

                <span>
                    ${escapeHTML(drink.name)}
                </span>

                <strong>
                    ${Number(drink.amount)} mg
                </strong>

            </button>
        `).join("")}

        <button
            class="view-my-drinks"
            type="button"
            onclick="openMyDrinksFromPicker()"
        >
            View My Drinks →
        </button>
    `;

    dropdown.classList.remove("hidden");
}

function selectDrinkSuggestion(
    id,
    encodedName,
    amount
) {
    const input =
        document.getElementById("drinkName");

    const dropdown =
        document.getElementById(
            "drinkSuggestions"
        );

    if (input) {
        input.value =
            decodeURIComponent(
                encodedName
            );
    }

    selectAmount(amount);
    v15FillLoggerFromDrink(v15SavedByName(input?.value||''));

    if (dropdown) {
        dropdown.classList.add("hidden");
    }
    updateSaveToMyDrinksOption();
}


function hideDrinkSuggestions() {
    const dropdown =
        document.getElementById(
            "drinkSuggestions"
        );

    if (dropdown) {
        dropdown.classList.add("hidden");
    }
}


function openMyDrinksFromPicker() {
    closeLogger();

    hideDrinkSuggestions();

    showPage("drinks");
}

/* =========================
   UPDATE EVERYTHING
========================= */

function updateHomeExtras() {
    const month=document.getElementById('homeMonthlyTotal');
    if(month){const prefix=dateKey(appDate()).slice(0,7);month.textContent=Object.entries(data.days||{}).filter(([day])=>day.startsWith(prefix)).reduce((sum,[,v])=>sum+Number(v.caffeine||0),0).toLocaleString();}
    const avg = document.getElementById("homeSevenDayAverage");
    if (avg) avg.textContent = Math.round(sevenDayTotal() / 7);
    const name = document.getElementById("homeLastDrink");
    const detail = document.getElementById("homeLastDrinkDetail");
    if (!name || !detail) return;
    const logs = [];
    Object.entries(data.days || {}).forEach(([day, value]) => {
        (value.entries || []).forEach((entry, i) => logs.push({day, entry, i}));
    });
    logs.sort((a,b) => b.day.localeCompare(a.day) || b.i - a.i);
    if (logs.length) {
        name.textContent = logs[0].entry.name || "Caffeine";
        detail.textContent = `${logs[0].entry.amount || 0} mg · ${logs[0].day}`;
    } else {
        name.textContent = "—";
        detail.textContent = "No drinks yet";
    }
}

function updateApp() {
    normalizeData();

    getDayData();

    saveData();

    updateGreeting();

    updateHome();

    updateEncouragement();

    renderChart();
    updateHomeExtras();

    renderHistory();

    renderProgress();

renderPersonalRecords();

updateCommitmentDateDisplay();

    updateDev();
}


/* =========================
   APP VERSION / PWA
========================= */

function registerServiceWorker() {
    if (
        "serviceWorker" in navigator &&
        location.protocol !== "file:"
    ) {
        window.addEventListener(
            "load",
            () => {
                navigator.serviceWorker
                    .register(
                        "./service-worker.js"
                    )
                    .catch(error => {
                        console.error(
                            "Service worker registration failed.",
                            error
                        );
                    });
            }
        );
    }
}


/* =========================
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        normalizeData();

        setupCollapsibleHistory();

        addHistoryDrinksToMyDrinks();

        loadAppearance();

        loadName();

        setupSystemAppearanceListener();

        updateApp();

        // Restored open dropdowns need a first render after initialization.
        // Home is shown first, so render when History is opened instead.
        refreshVisibleHistoryTrend();

        setupDevMode();

        preparePastDatePicker();

        registerServiceWorker();

        if (hasCommitted()) {
            closeCommitment();
        }

        else {
            showCommitment();
        }
    }
);
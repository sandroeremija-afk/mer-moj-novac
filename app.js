const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const translations = {
  hr: {
    skip:'Preskoči na sadržaj', primaryNav:'Glavna navigacija', productName:'Moj novac', navOverview:'Pregled', navBudgets:'Budžeti', navSavings:'Štednja', navActivity:'Aktivnost', weeklyCheck:'TJEDNI PREGLED', onTrackSave:'Na dobrom ste putu da ovaj mjesec uštedite', viewPlan:'Pogledaj plan', personalAccount:'Osobni račun', openNav:'Otvori navigaciju', closeNav:'Zatvori navigaciju', budgetMonth:'Mjesec budžeta', previousMonth:'Prethodni mjesec', nextMonth:'Sljedeći mjesec', language:'Jezik', notifications:'Obavijesti', addTransaction:'Dodaj transakciju', greeting:'Dobro jutro, Alex.', overviewSubtitle:'Evo kako danas stoje vaše financije.', adjustPlan:'Prilagodi plan', financialSummary:'Financijski sažetak', availableBalance:'Raspoloživo stanje', balanceInfo:'Informacije o stanju', fromLastMonth:'od prošlog mjeseca', spentMonth:'Potrošeno ovaj mjesec', budgetUsage:'Iskorištenost mjesečnog budžeta', savedMonth:'Ušteđeno ovaj mjesec', aheadPlan:'ispred plana', spendingGuardrail:'ZAŠTITA BUDŽETA', safeToSpend:'Sigurno za potrošiti', safeInfo:'Informacije o sigurnom iznosu', perDay:'na dan', canSpendUpTo:'Možete potrošiti još', withinBudget:'Unutar ste budžeta', overBudget:'Budžet je prekoračen', seeCalculation:'Pogledaj izračun', budgetTracker:'Praćenje budžeta', viewAll:'Prikaži sve', cashFlow:'NOVČANI TOK', spendingPace:'Tempo potrošnje', legend:'Legenda', actual:'Stvarno', planned:'Planirano', spentSoFar:'potrošeno dosad', lessThanPlanned:'206 € manje od plana', today:'Danas', topSavingsGoal:'GLAVNI CILJ ŠTEDNJE', emergencyFund:'Fond za hitne slučajeve', openSavings:'Otvori štednju', savingsProgress:'Napredak cilja štednje', monthlyDeposit:'Mjesečna uplata', estimatedFinish:'Procijenjeni završetak', addToSavings:'Dodaj u štednju', nextSevenDays:'SLJEDEĆIH 7 DANA', upcoming:'Nadolazeće', seeActivity:'Pogledaj aktivnost', monthlyPlan:'Mjesečni plan', budgetsTitle:'Budžeti', budgetsSubtitle:'Postavite granice po kategorijama i zadržite kontrolu nad potrošnjom.', budgetSummary:'Sažetak budžeta', monthlyBudget:'Mjesečni budžet', afterCommitments:'Nakon obveza, štednje i rezerve', remainingBudget:'Preostali budžet', protectedCommitments:'Sve obveze su zaštićene', allocatedCategories:'Raspoređeno po kategorijama', categoryLimits:'OGRANIČENJA KATEGORIJA', monthlySpendingPlan:'Mjesečni plan potrošnje', changeTotalBudget:'Promijeni ukupni budžet', yourFuture:'Vaša budućnost', savingsTitle:'Štednja', savingsSubtitle:'Gradite sigurnosnu mrežu bez ugrožavanja svakodnevnog budžeta.', newDeposit:'Nova uplata', activeGoal:'AKTIVNI CILJ', onTrack:'Prema planu', stillNeeded:'Još je potrebno', merRecommendation:'MER PREPORUKA', healthyReserve:'Zdrava sigurnosna rezerva', reserveRecommendation:'Vaša trenutačna rezerva već pokriva nekoliko mjeseci osnovnih troškova. Nastavite redovito uplaćivati kako biste izgradili još veću sigurnost.', essentialsCoverage:'Pokrivenost osnovnih troškova', reviewStrategy:'Pregledaj strategiju', thisYear:'OVA GODINA', savingsHistory:'Povijest štednje', monthlySavingsChart:'Mjesečne uplate u štednju', moneyMovement:'Kretanje novca', activityTitle:'Aktivnost', activitySubtitle:'Pregledajte prihode i troškove te brzo pronađite svaku transakciju.', searchTransactions:'Pretraži transakcije', filterCategory:'Filtriraj po kategoriji', allCategories:'Sve kategorije', nothingFound:'Nema rezultata', tryOtherSearch:'Pokušajte s drugim pojmom ili kategorijom.', close:'Zatvori', recordSpending:'ZABILJEŽI POTROŠNJU', transactionIntro:'Prije dodavanja provjerit ćemo kupnju prema ukupnom i kategorijskom budžetu.', merchantDescription:'Trgovac ili opis', merchantPlaceholder:'npr. Tržnica Dolac', amount:'Iznos', category:'Kategorija', guardReady:'Zaštita budžeta je spremna', enterImpact:'Unesite iznos za provjeru utjecaja.', checkAddTransaction:'Provjeri i dodaj transakciju', assessmentProgress:'Napredak procjene', step:'KORAK', shapePlan:'Oblikujmo vaš mjesečni plan.', incomeCommitments:'Počnite s prihodima i obveznim troškovima.', monthlyIncome:'Mjesečni neto prihod', essentialBills:'Osnovni računi i obveze', savingToward:'Prema čemu štedite?', targetProtected:'Realističan cilj bit će zaštićen prije svakodnevne potrošnje.', monthlySavingsTarget:'Mjesečni cilj štednje', currentSavings:'Trenutačno stanje štednje', chooseGuardrail:'Odaberite sigurnosnu rezervu.', breathingRoom:'Koliki dio prihoda želite ostaviti netaknutim?', comfortable:'Komotno', buffer15:'Sačuvaj 15% kao rezervu', balanced:'Uravnoteženo', buffer10:'Sačuvaj 10% kao rezervu', flexible:'Fleksibilno', buffer5:'Sačuvaj 5% kao rezervu', recommendedBudget:'Preporučeni budžet za potrošnju', back:'Natrag', continue:'Nastavi', usePlan:'Primijeni plan', calculationTitle:'Kako smo izračunali siguran iznos', essentialBillsShort:'Osnovne obveze', safetyBuffer:'Sigurnosna rezerva', flexibleMonthlyBudget:'Fleksibilni mjesečni budžet', alreadySpent:'Već potrošeno', safeRemainder:'Sigurno preostaje', commitmentsProtected:'Obvezni troškovi i cilj štednje ostaju zaštićeni pri svakoj novoj transakciji.', categoryBudget:'BUDŽET KATEGORIJE', setRealisticLimit:'Postavite realističnu granicu. Novi iznos ne može biti manji od već potrošenog.', monthlyLimit:'Mjesečni limit', saveLimit:'Spremi ograničenje', savingsDeposit:'UPLATA U ŠTEDNJU', addToEmergencyFund:'Dodaj u fond za hitne slučajeve', depositIntro:'Uplata će smanjiti raspoloživo stanje, ali neće se računati kao potrošnja.', depositAmount:'Iznos uplate', confirmDeposit:'Potvrdi uplatu', food:'Hrana i restorani', transport:'Prijevoz', shopping:'Kupovina', entertainment:'Zabava', other:'Ostalo', usedOf:'{spent} od {limit}', budgetOf:'{percent}% od {budget} budžeta', untilEndMonth:'do kraja {month}', daysRemaining:'Preostalo je {days} dana', goalOf:'od {target}', goalTargetOf:'od ciljanih {target}', months:'{value} mjeseci', allocated:'{amount} još nije raspoređeno', overAllocated:'Raspored prelazi budžet za {amount}', allocationPercent:'{percent}% raspoređeno', allocationCopy:'Kategorije pokrivaju {allocated} od {budget} dostupnog budžeta.', spentCategory:'Potrošeno: {spent}. Najviše dostupno: {max}.', transactionSafe:'{amount} ostaje sigurno', transactionSafeNote:'Ukupni i kategorijski budžet ostaju unutar granica.', transactionTotalBlocked:'Ova kupnja prelazi ukupni budžet', reduceBy:'Smanjite iznos za {amount} ili prilagodite plan.', transactionCategoryBlocked:'Ova kupnja prelazi budžet kategorije', categoryOnlyLeft:'U kategoriji {category} preostaje {amount}.', transactionWarning:'Blizu ste ograničenja kategorije', categoryAfter:'Nakon kupnje u kategoriji ostaje {amount}.', transactionAdded:'Transakcija je dodana i budžet je ažuriran.', transactionBlocked:'Transakcija je zaustavljena radi zaštite budžeta.', planReady:'Vaš novi plan je spreman.', planInvalid:'Plan mora ostaviti dovoljno sredstava za dosadašnju potrošnju.', limitSaved:'Ograničenje kategorije je spremljeno.', limitTooLow:'Limit ne može biti manji od već potrošenog.', allocationTooHigh:'Ukupna ograničenja ne mogu biti veća od mjesečnog budžeta.', depositSafe:'Nakon uplate na računu ostaje {amount}', billsRemain:'Osnovne obveze ostaju pokrivene.', depositBlocked:'Ovaj iznos zadire u novac za obveze', depositMax:'Za dodatnu štednju dostupno je najviše {amount}.', depositAdded:'{amount} dodano je u fond za hitne slučajeve.', viewingMonth:'Prikazan je {month}. Podaci ostaju u demonstracijskom načinu.', todayDate:'ČETVRTAK, 20. KOLOVOZA', dueTomorrow:'Sutra', dueDate:'{day}. kol', utilities:'Režije', emptyActivity:'Još nema transakcija.', dateToday:'Danas', dateYesterday:'Jučer', planPerMonth:'{amount} / mjesec', saveChanges:'Promjene su spremljene', historyUnavailable:'Povijesni podaci prikazuju demonstracijski prikaz.'
  },
  en: {
    skip:'Skip to content', primaryNav:'Primary navigation', productName:'My money', navOverview:'Overview', navBudgets:'Budgets', navSavings:'Savings', navActivity:'Activity', weeklyCheck:'WEEKLY CHECK-IN', onTrackSave:'You are on track to save', viewPlan:'View my plan', personalAccount:'Personal account', openNav:'Open navigation', closeNav:'Close navigation', budgetMonth:'Budget month', previousMonth:'Previous month', nextMonth:'Next month', language:'Language', notifications:'Notifications', addTransaction:'Add transaction', greeting:'Good morning, Alex.', overviewSubtitle:'Here is how your money looks today.', adjustPlan:'Adjust my plan', financialSummary:'Financial summary', availableBalance:'Available balance', balanceInfo:'Balance information', fromLastMonth:'from last month', spentMonth:'Spent this month', budgetUsage:'Monthly budget usage', savedMonth:'Saved this month', aheadPlan:'ahead of plan', spendingGuardrail:'SPENDING GUARDRAIL', safeToSpend:'Safe to spend', safeInfo:'Safe-to-spend information', perDay:'per day', canSpendUpTo:'You can still spend', withinBudget:'You are within budget', overBudget:'Budget exceeded', seeCalculation:'See calculation', budgetTracker:'Budget tracker', viewAll:'View all', cashFlow:'CASH FLOW', spendingPace:'Spending pace', legend:'Legend', actual:'Actual', planned:'Planned', spentSoFar:'spent so far', lessThanPlanned:'€206 less than planned', today:'Today', topSavingsGoal:'TOP SAVINGS GOAL', emergencyFund:'Emergency fund', openSavings:'Open savings', savingsProgress:'Savings goal progress', monthlyDeposit:'Monthly deposit', estimatedFinish:'Estimated finish', addToSavings:'Add to savings', nextSevenDays:'NEXT 7 DAYS', upcoming:'Upcoming', seeActivity:'See activity', monthlyPlan:'MONTHLY PLAN', budgetsTitle:'Budgets', budgetsSubtitle:'Set category limits and stay in control of your spending.', budgetSummary:'Budget summary', monthlyBudget:'Monthly budget', afterCommitments:'After bills, savings and buffer', remainingBudget:'Remaining budget', protectedCommitments:'All commitments are protected', allocatedCategories:'Allocated to categories', categoryLimits:'CATEGORY LIMITS', monthlySpendingPlan:'Monthly spending plan', changeTotalBudget:'Change total budget', yourFuture:'YOUR FUTURE', savingsTitle:'Savings', savingsSubtitle:'Build a safety net without compromising your everyday budget.', newDeposit:'New deposit', activeGoal:'ACTIVE GOAL', onTrack:'On track', stillNeeded:'Still needed', merRecommendation:'MER RECOMMENDATION', healthyReserve:'A healthy safety reserve', reserveRecommendation:'Your current reserve already covers several months of essential expenses. Keep making regular deposits to build even more security.', essentialsCoverage:'Essential expense coverage', reviewStrategy:'Review strategy', thisYear:'THIS YEAR', savingsHistory:'Savings history', monthlySavingsChart:'Monthly savings contributions', moneyMovement:'MONEY MOVEMENT', activityTitle:'Activity', activitySubtitle:'Review income and expenses and quickly find any transaction.', searchTransactions:'Search transactions', filterCategory:'Filter by category', allCategories:'All categories', nothingFound:'Nothing found', tryOtherSearch:'Try another search or category.', close:'Close', recordSpending:'RECORD SPENDING', transactionIntro:'We will check this purchase against both your total and category budgets before adding it.', merchantDescription:'Merchant or description', merchantPlaceholder:'e.g. Corner Market', amount:'Amount', category:'Category', guardReady:'Your budget guardrail is ready', enterImpact:'Enter an amount to see its impact.', checkAddTransaction:'Check and add transaction', assessmentProgress:'Assessment progress', step:'STEP', shapePlan:'Let’s shape your monthly plan.', incomeCommitments:'Start with what comes in and what must go out.', monthlyIncome:'Monthly take-home income', essentialBills:'Essential bills and commitments', savingToward:'What are you saving toward?', targetProtected:'A realistic target will be protected before everyday spending.', monthlySavingsTarget:'Monthly savings target', currentSavings:'Current savings balance', chooseGuardrail:'Choose your safety buffer.', breathingRoom:'How much of your income should remain untouched?', comfortable:'Comfortable', buffer15:'Keep 15% as a buffer', balanced:'Balanced', buffer10:'Keep 10% as a buffer', flexible:'Flexible', buffer5:'Keep 5% as a buffer', recommendedBudget:'Recommended spending budget', back:'Back', continue:'Continue', usePlan:'Use this plan', calculationTitle:'How we calculated your safe amount', essentialBillsShort:'Essential commitments', safetyBuffer:'Safety buffer', flexibleMonthlyBudget:'Flexible monthly budget', alreadySpent:'Already spent', safeRemainder:'Safe remainder', commitmentsProtected:'Essential expenses and your savings goal remain protected with every new transaction.', categoryBudget:'CATEGORY BUDGET', setRealisticLimit:'Set a realistic limit. The new amount cannot be lower than what you have already spent.', monthlyLimit:'Monthly limit', saveLimit:'Save limit', savingsDeposit:'SAVINGS DEPOSIT', addToEmergencyFund:'Add to emergency fund', depositIntro:'The deposit will reduce your available balance but will not count as spending.', depositAmount:'Deposit amount', confirmDeposit:'Confirm deposit', food:'Food and dining', transport:'Transport', shopping:'Shopping', entertainment:'Entertainment', other:'Other', usedOf:'{spent} of {limit}', budgetOf:'{percent}% of {budget} budget', untilEndMonth:'until the end of {month}', daysRemaining:'{days} days remaining', goalOf:'of {target}', goalTargetOf:'of {target} target', months:'{value} months', allocated:'{amount} is still unallocated', overAllocated:'Allocation is {amount} over budget', allocationPercent:'{percent}% allocated', allocationCopy:'Categories cover {allocated} of the {budget} available budget.', spentCategory:'Spent: {spent}. Maximum available: {max}.', transactionSafe:'{amount} stays safe', transactionSafeNote:'Both total and category budgets remain within their limits.', transactionTotalBlocked:'This purchase exceeds your total budget', reduceBy:'Reduce it by {amount} or adjust your plan.', transactionCategoryBlocked:'This purchase exceeds the category budget', categoryOnlyLeft:'Only {amount} remains in {category}.', transactionWarning:'You are close to the category limit', categoryAfter:'After this purchase, {amount} remains in the category.', transactionAdded:'Transaction added and budget updated.', transactionBlocked:'Transaction blocked to protect your budget.', planReady:'Your new plan is ready.', planInvalid:'The plan must leave enough room for spending already recorded.', limitSaved:'Category limit saved.', limitTooLow:'The limit cannot be lower than the amount already spent.', allocationTooHigh:'Total category limits cannot exceed the monthly budget.', depositSafe:'{amount} will remain in your account', billsRemain:'Essential commitments remain covered.', depositBlocked:'This amount uses money reserved for commitments', depositMax:'At most {amount} is available for extra savings.', depositAdded:'{amount} added to your emergency fund.', viewingMonth:'Showing {month}. Values remain in demo mode.', todayDate:'THURSDAY, 20 AUGUST', dueTomorrow:'Tomorrow', dueDate:'{day} Aug', utilities:'Utilities', emptyActivity:'No transactions yet.', dateToday:'Today', dateYesterday:'Yesterday', planPerMonth:'{amount} / month', saveChanges:'Changes saved', historyUnavailable:'Historical values use the demonstration view.'
  }
};

translations.hr.merRecommendation = 'MER Preporuka';
translations.en.merRecommendation = 'MER Recommendation';

Object.assign(translations.hr, {
  businessAccount:'Poslovni račun', darkMode:'Tamni način', lightMode:'Svijetli način', switchAccount:'PROMIJENI RAČUN', settings:'POSTAVKE', exportCsv:'Izvezi mjesečni CSV', notificationCenter:'Centar obavijesti',
  balanceTooltip:'Iznos dostupan na aktivnom računu nakon evidentiranih transakcija i uplata u štednju.', safeTooltip:'Iznos koji možete potrošiti bez zadiranja u račune, cilj štednje i sigurnosnu rezervu.',
  newCategory:'Nova kategorija', recurringExpenses:'PONAVLJAJUĆI TROŠKOVI', scheduledPayments:'Zakazana plaćanja', newRecurring:'Novi trošak', totalSavedPeriod:'Ukupno ušteđeno u prikazanom razdoblju', savingsEntries:'UPLATE U ŠTEDNJU', recentSavingsEntries:'Nedavne uplate',
  deleteExpense:'Izbriši trošak', editExpense:'Uredi transakciju', updateExpense:'Spremi promjene', categoryName:'Naziv kategorije', categoryIcon:'Oznaka', deleteCategory:'Izbriši kategoriju', saveCategory:'Spremi kategoriju', savingsNote:'Opis uplate', deleteEntry:'Izbriši uplatu', editSavingsEntry:'Uredi uplatu u štednju', updateSavings:'Spremi uplatu',
  recurringExpense:'PONAVLJAJUĆI TROŠAK', scheduleExpense:'Zakaži trošak', recurringIntro:'Trošak će se automatski evidentirati na odabrani dan svakog mjeseca.', recurringDay:'Dan u mjesecu', startDate:'Datum početka', deleteRecurring:'Izbriši raspored', saveSchedule:'Spremi raspored', nextCharge:'Sljedeće terećenje: {date}', monthlyOnDay:'Mjesečno, {day}. dana', noRecurring:'Još nema zakazanih troškova.', recurringPreview:'Ako mjesec nema odabrani dan, trošak će se evidentirati posljednjeg dana tog mjeseca.',
  budgetLimitNear:'Upozorenje: iskorišteno je najmanje 80% budžeta', budgetLimitReached:'Ograničenje budžeta je dosegnuto', categoryCreated:'Kategorija je dodana.', categoryUpdated:'Kategorija je ažurirana.', categoryDeleted:'Kategorija je izbrisana, a povezane stavke premještene u Ostalo.', categoryNameRequired:'Unesite naziv kategorije.', duplicateCategory:'Kategorija s tim nazivom već postoji.',
  expenseUpdated:'Transakcija je ažurirana.', expenseDeleted:'Transakcija je izbrisana.', savingsUpdated:'Uplata u štednju je ažurirana.', savingsDeleted:'Uplata u štednju je izbrisana.', recurringSaved:'Ponavljajući trošak je spremljen.', recurringDeleted:'Ponavljajući trošak je izbrisan.', accountSwitched:'Aktivan je {account}.', csvExported:'CSV izvještaj je preuzet.',
  alertBudgetTitle:'Budžet kategorije zahtijeva pažnju', alertBudgetBody:'{category} je na {percent}% postavljenog ograničenja.', alertRecurringTitle:'Uskoro slijedi ponavljajući trošak', alertRecurringBody:'{name} ({amount}) dospijeva {date}.', alertSpendingTitle:'Mjesečni budžet je pri kraju', alertSpendingBody:'Preostalo je još {amount} sigurnog iznosa.', reviewBudget:'Pregledaj budžet', reviewRecurring:'Pregledaj raspored', reviewSpending:'Pregledaj potrošnju', noNotifications:'Nema novih upozorenja.', notificationCount:'{count} obavijesti', accountIsolation:'Podaci ovog računa potpuno su odvojeni.', csvFileName:'mer-troskovi-{account}-{month}.csv', recurringInvalidDay:'Dan mora biti između 1 i 31.',
  navInsights:'Uvidi', reports:'Izvještaji', insightsTitle:'Uvidi', insightsSubtitle:'Prihodi, troškovi i trendovi na jednom mjestu.', reportTimeframe:'Razdoblje izvještaja', daily:'Danas', monthly:'Ovaj mjesec', yearToDate:'Ova godina', allTime:'Sve vrijeme', cashflowSummary:'Sažetak novčanog toka', netTotal:'Neto ukupno', netInfo:'Informacije o neto iznosu', netTooltip:'Neto ukupno je zbroj prihoda umanjen za zbroj troškova u odabranom razdoblju.', incomeMinusExpenses:'Prihodi umanjeni za troškove', totalIncome:'Ukupni prihodi', totalExpenses:'Ukupni troškovi', income:'Prihod', expense:'Trošak', transactionsShort:'transakcija',
  savingsRate:'Stopa štednje', savingsRateInfo:'Informacije o stopi štednje', savingsRateTooltip:'Postotak prihoda koji ostaje nakon svih evidentiranih troškova u odabranom razdoblju.', savingsRateContext:'Udio prihoda koji ostaje nakon troškova.', noIncomeRate:'Dodajte prihod za izračun stope.', momComparison:'Promjena troškova', momInfo:'Informacije o usporedbi', momTooltip:'Uspoređuje troškove tekućeg mjeseca s ukupnim troškovima prethodnog mjeseca.', previousMonthComparison:'U odnosu na prošli mjesec', moreSpent:'više potrošeno', lessSpent:'manje potrošeno', sameSpent:'bez promjene', noPreviousMonth:'Nema podataka za prethodni mjesec', topSpendingCategory:'Najveća kategorija troška', topCategoryInfo:'Informacije o najvećoj kategoriji', topCategoryTooltip:'Kategorija s najvećim ukupnim iznosom troškova u odabranom razdoblju.', topCategoryContext:'{amount} · {share}% svih troškova', noExpensesPeriod:'Nema troškova u razdoblju',
  cashflowHistory:'POVIJEST NOVČANOG TOKA', incomeVsExpenses:'Prihodi i troškovi', cashflowChart:'Usporedba prihoda i troškova', noDataTitle:'Još nema podataka', noDataBody:'Dodajte prihod ili trošak za prikaz analize.', spendingMix:'STRUKTURA POTROŠNJE', categoryBreakdown:'Troškovi po kategoriji', noIncomeTitle:'Još nema zabilježenih prihoda', noIncomeBody:'Dodajte prvi prihod kako biste vidjeli neto iznos i stopu štednje.', addIncome:'Dodaj prihod', customization:'PRILAGODBA', incomeCategories:'Kategorije prihoda', newIncomeCategory:'Nova kategorija prihoda', incomeCategory:'KATEGORIJA PRIHODA', incomeCategoryIntro:'Organizirajte izvore prihoda oznakom koja vam ima smisla.',
  filterType:'Filtriraj po vrsti', allTypes:'Sve vrste', expensesOnly:'Troškovi', incomeOnly:'Prihodi', transactionType:'Vrsta transakcije', recordIncome:'ZABILJEŽI PRIHOD', incomeIntro:'Evidentirani prihod povećat će raspoloživo stanje i prikazati se u Uvidima.', incomePlaceholder:'npr. Plaća za kolovoz', incomeReady:'Prihod povećava stanje', balanceIncrease:'Raspoloživo stanje povećat će se na {amount}.', addIncomeSubmit:'Dodaj prihod', editIncome:'Uredi prihod', updateIncome:'Spremi prihod', deleteTransaction:'Izbriši transakciju', incomeAdded:'Prihod je dodan.', incomeUpdated:'Prihod je ažuriran.', incomeDeleted:'Prihod je izbrisan.',
  salary:'Plaća', gift:'Dar', freelance:'Freelance / dodatni posao', otherIncome:'Ostali prihod', incomeCategoryCreated:'Kategorija prihoda je dodana.', incomeCategoryUpdated:'Kategorija prihoda je ažurirana.', incomeCategoryDeleted:'Kategorija prihoda je izbrisana, a povezane stavke premještene su u Ostali prihod.'
});
Object.assign(translations.en, {
  businessAccount:'Business account', darkMode:'Dark mode', lightMode:'Light mode', switchAccount:'SWITCH ACCOUNT', settings:'SETTINGS', exportCsv:'Export monthly CSV', notificationCenter:'Notification center',
  balanceTooltip:'The amount available in the active account after recorded transactions and savings deposits.', safeTooltip:'What you can spend without using money reserved for bills, savings goals, or your safety buffer.',
  newCategory:'New category', recurringExpenses:'RECURRING EXPENSES', scheduledPayments:'Scheduled payments', newRecurring:'New expense', totalSavedPeriod:'Total saved in the displayed period', savingsEntries:'SAVINGS ENTRIES', recentSavingsEntries:'Recent deposits',
  deleteExpense:'Delete expense', editExpense:'Edit transaction', updateExpense:'Save changes', categoryName:'Category name', categoryIcon:'Label', deleteCategory:'Delete category', saveCategory:'Save category', savingsNote:'Deposit description', deleteEntry:'Delete deposit', editSavingsEntry:'Edit savings deposit', updateSavings:'Save deposit',
  recurringExpense:'RECURRING EXPENSE', scheduleExpense:'Schedule expense', recurringIntro:'The expense will be logged automatically on the selected day each month.', recurringDay:'Day of month', startDate:'Start date', deleteRecurring:'Delete schedule', saveSchedule:'Save schedule', nextCharge:'Next charge: {date}', monthlyOnDay:'Monthly, on day {day}', noRecurring:'No scheduled expenses yet.', recurringPreview:'If a month does not contain the selected day, the expense will be logged on that month’s final day.',
  budgetLimitNear:'Warning: at least 80% of the budget is used', budgetLimitReached:'Budget limit reached', categoryCreated:'Category added.', categoryUpdated:'Category updated.', categoryDeleted:'Category deleted and linked items moved to Other.', categoryNameRequired:'Enter a category name.', duplicateCategory:'A category with that name already exists.',
  expenseUpdated:'Transaction updated.', expenseDeleted:'Transaction deleted.', savingsUpdated:'Savings deposit updated.', savingsDeleted:'Savings deposit deleted.', recurringSaved:'Recurring expense saved.', recurringDeleted:'Recurring expense deleted.', accountSwitched:'{account} is now active.', csvExported:'CSV report downloaded.',
  alertBudgetTitle:'A category budget needs attention', alertBudgetBody:'{category} is at {percent}% of its limit.', alertRecurringTitle:'A recurring expense is coming up', alertRecurringBody:'{name} ({amount}) is due {date}.', alertSpendingTitle:'Your monthly budget is running low', alertSpendingBody:'Only {amount} remains safe to spend.', reviewBudget:'Review budget', reviewRecurring:'Review schedule', reviewSpending:'Review spending', noNotifications:'No new alerts.', notificationCount:'{count} notifications', accountIsolation:'This account’s data is completely isolated.', csvFileName:'mer-expenses-{account}-{month}.csv', recurringInvalidDay:'Day must be between 1 and 31.',
  navInsights:'Insights', reports:'Reports', insightsTitle:'Insights', insightsSubtitle:'Income, expenses, and trends in one focused place.', reportTimeframe:'Report timeframe', daily:'Today', monthly:'This month', yearToDate:'This year', allTime:'All time', cashflowSummary:'Cash-flow summary', netTotal:'Net total', netInfo:'Net total information', netTooltip:'Net total is all income minus all expenses in the selected timeframe.', incomeMinusExpenses:'Income minus expenses', totalIncome:'Total income', totalExpenses:'Total expenses', income:'Income', expense:'Expense', transactionsShort:'transactions',
  savingsRate:'Savings rate', savingsRateInfo:'Savings rate information', savingsRateTooltip:'The percentage of recorded income left after all recorded expenses in the selected timeframe.', savingsRateContext:'The share of income left after expenses.', noIncomeRate:'Add income to calculate this rate.', momComparison:'Expense change', momInfo:'Comparison information', momTooltip:'Compares current-month expenses with total expenses from the previous month.', previousMonthComparison:'Compared with last month', moreSpent:'more spent', lessSpent:'less spent', sameSpent:'no change', noPreviousMonth:'No previous-month data', topSpendingCategory:'Top spending category', topCategoryInfo:'Top category information', topCategoryTooltip:'The category with the highest total expenses in the selected timeframe.', topCategoryContext:'{amount} · {share}% of all expenses', noExpensesPeriod:'No expenses in this timeframe',
  cashflowHistory:'CASH-FLOW HISTORY', incomeVsExpenses:'Income and expenses', cashflowChart:'Income and expense comparison', noDataTitle:'No data yet', noDataBody:'Add income or an expense to see analysis.', spendingMix:'SPENDING MIX', categoryBreakdown:'Expenses by category', noIncomeTitle:'No income recorded yet', noIncomeBody:'Add your first income to see a net total and savings rate.', addIncome:'Add income', customization:'CUSTOMIZATION', incomeCategories:'Income categories', newIncomeCategory:'New income category', incomeCategory:'INCOME CATEGORY', incomeCategoryIntro:'Organize income sources with a label that makes sense to you.',
  filterType:'Filter by type', allTypes:'All types', expensesOnly:'Expenses', incomeOnly:'Income', transactionType:'Transaction type', recordIncome:'RECORD INCOME', incomeIntro:'Recorded income will increase your available balance and appear in Insights.', incomePlaceholder:'e.g. August salary', incomeReady:'Income increases your balance', balanceIncrease:'Your available balance will increase to {amount}.', addIncomeSubmit:'Add income', editIncome:'Edit income', updateIncome:'Save income', deleteTransaction:'Delete transaction', incomeAdded:'Income added.', incomeUpdated:'Income updated.', incomeDeleted:'Income deleted.',
  salary:'Salary', gift:'Gift', freelance:'Freelance / side hustle', otherIncome:'Other income', incomeCategoryCreated:'Income category added.', incomeCategoryUpdated:'Income category updated.', incomeCategoryDeleted:'Income category deleted and linked entries moved to Other income.'
});

Object.assign(translations.en, {
  monthlyPlan:'Monthly plan',
  yourFuture:'Your future',
  moneyMovement:'Money movement'
});

Object.assign(translations.hr, {
  userSettings:'KORISNIČKE POSTAVKE', connectedBanks:'Povezane banke i kartice', connectedBanksIntro:'Povežite račune putem sigurnog demonstracijskog Open Banking sloja i odredite profil za svaku vezu.', profileIsolationTitle:'Odvajanje profila je uključeno', profileIsolationBody:'Sinkronizirane transakcije zapisuju se samo u profil dodijeljen tom računu.', yourConnections:'Vaše veze', addConnection:'Dodaj vezu', noBankConnections:'Još nema povezanih računa', noBankConnectionsBody:'Povežite demo banku kako biste isprobali automatski uvoz bez dijeljenja stvarnih vjerodajnica.', secureDemoConnection:'SIGURNA DEMO VEZA', chooseInstitution:'Odaberite instituciju', chooseAccounts:'Odaberite račune ili kartice', institutionStepHint:'Odaberite banku ili kartični servis koji želite povezati.', backToInstitutions:'Natrag na institucije', connectionAlias:'Naziv veze', connectionAliasPlaceholder:'npr. Glavni račun', apiAccessToken:'API pristupni token', apiTokenPlaceholder:'Demo token (neobavezno)', demoConsentExtended:'Demo token koristi se samo tijekom povezivanja i nikada se ne sprema. Bankovne lozinke nisu potrebne.', bankStepOne:'KORAK 1 OD 2', bankStepTwo:'KORAK 2 OD 2', selectInstitution:'Najprije odaberite instituciju.', assignProfile:'Dodijeli profilu', demoConsent:'Ovo je modularni demo provider. Ne traži ni ne sprema bankovne lozinke.', connectAndSync:'Poveži i sinkroniziraj', exportCsvHint:'Preuzmite sažetak aktivnog profila.', bankSyncStatus:'Status sinkronizacije banke', bankSyncReady:'Bankovna sinkronizacija', connectBank:'Poveži banku', syncNow:'Sinkroniziraj sada', syncing:'Sinkronizacija…', noConnectedAccounts:'Nema povezanih računa', lastSyncedNow:'Upravo sinkronizirano', lastSyncedMinutes:'Zadnja sinkronizacija prije {count} min', lastSyncedHours:'Zadnja sinkronizacija prije {count} h', neverSynced:'Čeka prvu sinkronizaciju', connectionsSummary:'{count} povezanih računa · aktivni profil: {profile}', connectedAccount:'Povezano', syncFailed:'Sinkronizacija nije uspjela', tokenExpired:'Bankovno odobrenje je isteklo. Ponovno povežite račun.', connectionLost:'Banka više nije dostupna. Ponovno povežite račun.', rateLimited:'Banka je privremeno ograničila sinkronizaciju. Pokušajte za {count} s.', reconnect:'Ponovno poveži', refreshConnection:'Osvježi vezu', manualBankSyncTooltip:'Ručno sinkroniziraj transakcije', unlinkConnection:'Odspoji račun', unlinkBankTooltip:'Prekini vezu s bankom', confirmUnlink:'Potvrdi odspajanje', mappingUpdated:'Račun je premješten u profil {profile}.', connectionUnlinked:'Veza je uklonjena. Prethodno uvezene transakcije ostaju u profilu.', accountsConnected:'Povezano je {count} računa. Uvezeno: {imported}.', syncComplete:'Sinkronizacija dovršena · {imported} novih, {duplicates} duplikata preskočeno.', noNewTransactions:'Nema novih transakcija.', selectAccount:'Odaberite barem jedan račun.', manualSource:'Ručno', autoSource:'Automatski', needsReview:'Potrebna kategorija', needsReviewShort:'za pregled', uncategorizedQueue:'Nekategorizirane transakcije', reviewQueueCopy:'{count} automatskih transakcija treba potvrdu kategorije.', showAllTransactions:'Prikaži sve', categoryApproved:'Kategorija je potvrđena.', alertUncategorizedTitle:'Nove transakcije trebaju pregled', alertUncategorizedBody:'{count} uvezenih transakcija nema sigurnu kategoriju.', reviewCategories:'Pregledaj kategorije', backgroundSync:'Automatska sinkronizacija svakih 5 minuta dok je aplikacija otvorena.'
});

Object.assign(translations.en, {
  userSettings:'USER SETTINGS', connectedBanks:'Connected Banks & Cards', connectedBanksIntro:'Connect accounts through a secure demo Open Banking layer and choose a profile for every connection.', profileIsolationTitle:'Profile isolation is on', profileIsolationBody:'Synced transactions are written only to the profile assigned to that account.', yourConnections:'Your connections', addConnection:'Add connection', noBankConnections:'No connected accounts yet', noBankConnectionsBody:'Connect a demo bank to try automatic imports without sharing real banking credentials.', secureDemoConnection:'SECURE DEMO CONNECTION', chooseInstitution:'Choose an institution', chooseAccounts:'Choose accounts or cards', institutionStepHint:'Choose the bank or card provider you want to connect.', backToInstitutions:'Back to institutions', connectionAlias:'Connection name', connectionAliasPlaceholder:'e.g. Main account', apiAccessToken:'API access token', apiTokenPlaceholder:'Demo token (optional)', demoConsentExtended:'The demo token is used only while connecting and is never stored. Bank passwords are not required.', bankStepOne:'STEP 1 OF 2', bankStepTwo:'STEP 2 OF 2', selectInstitution:'Choose an institution first.', assignProfile:'Assign to profile', demoConsent:'This is a modular demo provider. It never asks for or stores bank passwords.', connectAndSync:'Connect and sync', exportCsvHint:'Download a summary for the active profile.', bankSyncStatus:'Bank sync status', bankSyncReady:'Bank sync', connectBank:'Connect bank', syncNow:'Sync now', syncing:'Syncing…', noConnectedAccounts:'No connected accounts', lastSyncedNow:'Synced just now', lastSyncedMinutes:'Last synced {count} min ago', lastSyncedHours:'Last synced {count} hr ago', neverSynced:'Waiting for first sync', connectionsSummary:'{count} connected accounts · active profile: {profile}', connectedAccount:'Connected', syncFailed:'Sync failed', tokenExpired:'Bank authorization expired. Reconnect this account.', connectionLost:'The bank account is no longer available. Reconnect it.', rateLimited:'The bank temporarily limited syncing. Try again in {count}s.', reconnect:'Reconnect', refreshConnection:'Refresh connection', manualBankSyncTooltip:'Manually sync transactions', unlinkConnection:'Unlink account', unlinkBankTooltip:'Disconnect bank', confirmUnlink:'Confirm unlink', mappingUpdated:'Account moved to the {profile} profile.', connectionUnlinked:'Connection removed. Previously imported transactions remain in the profile.', accountsConnected:'Connected {count} accounts. Imported: {imported}.', syncComplete:'Sync complete · {imported} new, {duplicates} duplicates skipped.', noNewTransactions:'No new transactions.', selectAccount:'Select at least one account.', manualSource:'Manual', autoSource:'Automatic', needsReview:'Needs category', needsReviewShort:'to review', uncategorizedQueue:'Uncategorized transactions', reviewQueueCopy:'{count} automatic transactions need a category check.', showAllTransactions:'Show all', categoryApproved:'Category confirmed.', alertUncategorizedTitle:'New transactions need review', alertUncategorizedBody:'{count} imported transactions do not have a confident category.', reviewCategories:'Review categories', backgroundSync:'Automatic sync runs every 5 minutes while the app is open.'
});

Object.assign(translations.hr,{logout:'Odjava',healthBeauty:'Drogerija i osobna njega',advancedInsights:'Napredni financijski uvidi',categoryDonutTitle:'Potrošnja po kategoriji',expensesShort:'troškovi',merchantBreakdown:'NAJVEĆE KATEGORIJE',topFiveMerchants:'Najveće kategorije',manageSubscriptions:'Upravljaj pretplatama',savingsHealth:'ZDRAVLJE ŠTEDNJE',ofIncome:'od prihoda',subscriptionManager:'UPRAVLJANJE PRETPLATAMA',recurringSubscriptions:'Ponavljajuće pretplate',subscriptionIntro:'Mer prepoznaje poznate servise i mjesečni ritam naplate. Prije obnove provjerite iznos i kategoriju.',detectedSubscriptions:'Otkrivene pretplate',monthlySubscriptionCost:'Procijenjeni mjesečni trošak',renewsIn:'Obnova za {days} dana',noSubscriptions:'Nema otkrivenih pretplata.',roundUps:'Zaokruživanje',roundUpsHint:'Razlika do sljedećeg punog eura ide u ovaj trezor.',monthlyRequired:'Potrebno mjesečno',daysToGoal:'{days} dana do cilja',openBankingArchitecture:'PSD2 adapteri spremni',dashboardGreeting:'Dobro jutro, Mer',manageBankConnections:'Upravljaj vezama',connectedCount:'{count} povezano'});
Object.assign(translations.en,{logout:'Log out',healthBeauty:'Health & beauty',advancedInsights:'Advanced financial insights',categoryDonutTitle:'Category spending',expensesShort:'expenses',merchantBreakdown:'LARGEST CATEGORIES',topFiveMerchants:'Largest categories',manageSubscriptions:'Manage subscriptions',savingsHealth:'SAVINGS HEALTH',ofIncome:'of income',subscriptionManager:'SUBSCRIPTION MANAGER',recurringSubscriptions:'Recurring subscriptions',subscriptionIntro:'Mer detects known services and monthly payment cadence. Review the amount and category before renewal.',detectedSubscriptions:'Detected subscriptions',monthlySubscriptionCost:'Estimated monthly cost',renewsIn:'Renews in {days} days',noSubscriptions:'No subscriptions detected.',roundUps:'Spare change round-ups',roundUpsHint:'The difference to the next whole euro moves into this vault.',monthlyRequired:'Required monthly',daysToGoal:'{days} days to goal',openBankingArchitecture:'PSD2 adapters ready',dashboardGreeting:'Good morning, Mer',manageBankConnections:'Manage connections',connectedCount:'{count} connected'});
Object.assign(translations.hr,{transactionTotalBlocked:'Ova transakcija premašuje mjesečni budžet',reduceBy:'Unos će biti spremljen, a budžet prikazan kao prekoračen za {amount}.',transactionCategoryBlocked:'Ova transakcija premašuje budžet kategorije',categoryOverBy:'Unos će biti spremljen. {category} će biti {amount} iznad limita.',transactionDailyWarning:'Iznos je veći od dnevnog plana',transactionDailySoftNote:'Unos će biti spremljen. Dnevni plan iznosi {amount}.',transactionAddedOverBudget:'Transakcija je spremljena. Budžet je prekoračen za {amount}.'});
Object.assign(translations.en,{transactionTotalBlocked:'This transaction exceeds the monthly budget',reduceBy:'The entry will be saved and the budget will show an overage of {amount}.',transactionCategoryBlocked:'This transaction exceeds the category budget',categoryOverBy:'The entry will be saved. {category} will be {amount} over its limit.',transactionDailyWarning:'The amount is above the daily plan',transactionDailySoftNote:'The entry will be saved. The daily plan is {amount}.',transactionAddedOverBudget:'Transaction saved. The budget is over by {amount}.'});
Object.assign(translations.hr,{incomeImpact:'Raspoloživo stanje povećat će se na {balance}, a sigurno za potrošiti na {safe}.'});
Object.assign(translations.en,{incomeImpact:'Available balance will increase to {balance}, and safe to spend to {safe}.'});

Object.assign(translations.hr,{budgetCategoryList:'Popis budžetskih kategorija',showAllCategories:'Prikaži sve',manageBudgetCategories:'Upravljaj kategorijama',budgetManagerIntro:'Pretražite sve kategorije, provjerite potrošnju i uredite mjesečne limite.',addBudget:'Dodaj budžet',searchBudgetCategories:'Pretraži kategorije',filterBudgetStatus:'Filtriraj po statusu budžeta',allBudgetStatuses:'Svi statusi',withinBudgetStatus:'Dostupno',nearLimitStatus:'Blizu limita',limitReachedStatus:'Dosegnut limit',editBudgetHint:'Odaberite olovku za izravno uređivanje limita.',usage:'Iskorištenost',spentVsLimit:'Potrošeno / limit',actions:'Radnje',noBudgetCategories:'Nema odgovarajućih kategorija',tryDifferentBudgetFilter:'Pokušajte s drugim pojmom ili statusom.',budgetCategoryCount:'Prikazano {visible} od {total} kategorija'});
Object.assign(translations.en,{budgetCategoryList:'Budget category list',showAllCategories:'Show all',manageBudgetCategories:'Manage categories',budgetManagerIntro:'Search every category, review spending, and edit monthly limits.',addBudget:'Add budget',searchBudgetCategories:'Search categories',filterBudgetStatus:'Filter by budget status',allBudgetStatuses:'All statuses',withinBudgetStatus:'Available',nearLimitStatus:'Near limit',limitReachedStatus:'Limit reached',editBudgetHint:'Select the pencil to edit a limit directly.',usage:'Usage',spentVsLimit:'Spent / limit',actions:'Actions',noBudgetCategories:'No matching categories',tryDifferentBudgetFilter:'Try another search term or status.',budgetCategoryCount:'Showing {visible} of {total} categories'});
Object.assign(translations.hr,{monthlyBudget:'Fleksibilni budžet za potrošnju',afterCommitments:'Prihodi nakon obveza, štednje i rezerve',remainingBudget:'Sigurno preostaje nakon potrošnje',allocatedCategories:'Raspoređeno u kategorije',budgetOf:'{percent}% fleksibilnog budžeta od {budget}',budgetOverageExact:'{percent}% · {amount} iznad limita',budgetRecoveryOverTitle:'Plan kategorija prelazi fleksibilni budžet',budgetRecoveryOverCopy:'Smanjite samo neiskorištene dijelove limita za {amount}; zabilježena potrošnja ostaje netaknuta.',budgetRecoveryCategoryTitle:'Jedna ili više kategorija je prekoračena',budgetRecoveryCategoryCopy:'Preraspodijelite neiskorišteni limit iz druge kategorije bez promjene ukupnog budžeta.',autoBalanceBudget:'Uskladi plan',coverOverspending:'Pokrij prekoračenje',rebalanceBudget:'PRERASPODJELA BUDŽETA',coverOverspendingIntro:'Premjestite neiskorišteni dio limita iz jedne kategorije u prekoračenu kategoriju bez promjene ukupnog budžeta.',overspentCategory:'Prekoračena kategorija',fundFromCategory:'Prenesi iz kategorije',transferAmount:'Iznos preraspodjele',confirmTransfer:'Potvrdi preraspodjelu',transferContext:'Dostupno za prijenos: {available}. Prekoračenje: {overage}.',transferInvalid:'Odaberite valjane kategorije i iznos.',transferSaved:'Preraspodijeljeno je {amount}. Ukupni budžet ostao je isti.',balancePlanConfirm:'Smanjit ćemo samo neiskorištene dijelove kategorijskih limita. Zabilježena potrošnja neće se mijenjati. Nastaviti?',balancePlanReady:'Plan je usklađen za {amount}.',balancePlanPartial:'Smanjeno je {amount}, ali {remaining} nije moguće pokriti bez promjene ukupnog plana.',spentCategory:'Potrošeno: {spent}. Najniži dopušteni limit je {minimum}; trenutačni plan dopušta najviše {maximum}.',positiveAmountRequired:'Iznos mora biti veći od nule.',demoWorkspace:'DEMO PROSTOR',demoResetTitle:'Vrati čisti demo prostor',demoResetHint:'Uklanja probne promjene iz oba profila i vraća početne MER podatke. Postavke prikaza ostaju sačuvane.',resetDemoData:'Vrati demo podatke',confirmDemoResetTitle:'Vratiti početne demo podatke?',confirmDemoResetBody:'Sve probne transakcije, pravila, ciljevi i bankovne veze u Osobnom i Poslovnom profilu bit će zamijenjeni početnim primjerima. Ovu radnju nije moguće poništiti.',confirmDemoReset:'Da, vrati podatke',demoResetComplete:'Demo prostor vraćen je na početne podatke.',demoResetUnavailable:'Reset je dostupan samo u demo načinu.',cancel:'Otkaži'});
Object.assign(translations.en,{monthlyBudget:'Flexible spending budget',afterCommitments:'Income after bills, savings and buffer',remainingBudget:'Safe remainder after spending',allocatedCategories:'Allocated to categories',budgetOf:'{percent}% of the {budget} flexible budget',budgetOverageExact:'{percent}% · {amount} over limit',budgetRecoveryOverTitle:'Category plan exceeds the flexible budget',budgetRecoveryOverCopy:'Reduce only unused category headroom by {amount}; recorded spending stays untouched.',budgetRecoveryCategoryTitle:'One or more categories are over limit',budgetRecoveryCategoryCopy:'Move unused room from another category without changing the total budget.',autoBalanceBudget:'Balance plan',coverOverspending:'Cover overspending',rebalanceBudget:'BUDGET REALLOCATION',coverOverspendingIntro:'Move unused room from one category to an overspent category without changing the total budget.',overspentCategory:'Overspent category',fundFromCategory:'Move from category',transferAmount:'Transfer amount',confirmTransfer:'Confirm reallocation',transferContext:'Available to move: {available}. Overage: {overage}.',transferInvalid:'Choose valid categories and an amount.',transferSaved:'Moved {amount}. The total budget stayed unchanged.',balancePlanConfirm:'Only unused category headroom will be reduced. Recorded spending will not change. Continue?',balancePlanReady:'The plan was balanced by {amount}.',balancePlanPartial:'Reduced by {amount}, but {remaining} cannot be covered without changing the total plan.',spentCategory:'Spent: {spent}. The minimum allowed limit is {minimum}; the current plan allows up to {maximum}.',positiveAmountRequired:'Amount must be greater than zero.',demoWorkspace:'DEMO WORKSPACE',demoResetTitle:'Restore a clean demo workspace',demoResetHint:'Removes trial changes from both profiles and restores the original MER sample data. Display preferences stay saved.',resetDemoData:'Reset demo data',confirmDemoResetTitle:'Restore the original demo data?',confirmDemoResetBody:'All trial transactions, rules, goals and bank connections in Personal and Business will be replaced with the original examples. This cannot be undone.',confirmDemoReset:'Yes, restore data',demoResetComplete:'The demo workspace was restored.',demoResetUnavailable:'Reset is available only in demo mode.',cancel:'Cancel'});
Object.assign(translations.hr,{activityFilters:'Filtri aktivnosti',filters:'Filteri',dateFrom:'Od datuma',dateTo:'Do datuma',sortTransactions:'Sortiraj transakcije',sortNewest:'Najnovije prvo',sortOldest:'Najstarije prvo',sortAmountHigh:'Iznos: veći prema manjem',sortAmountLow:'Iznos: manji prema većem',clearFilters:'Očisti filtere'});
Object.assign(translations.en,{activityFilters:'Activity filters',filters:'Filters',dateFrom:'From date',dateTo:'To date',sortTransactions:'Sort transactions',sortNewest:'Newest first',sortOldest:'Oldest first',sortAmountHigh:'Amount: high to low',sortAmountLow:'Amount: low to high',clearFilters:'Clear filters'});
Object.assign(translations.hr,{activityViewMode:'Način prikaza aktivnosti',activityPages:'Stranice',activityContinuous:'Prikaži sve',activityPagination:'Stranice aktivnosti',previousPage:'Prethodna',nextPage:'Sljedeća',activityPageLabel:'Stranica {page} od {pages}',activityResultCount:'Prikazano {visible} od {total} transakcija'});
Object.assign(translations.en,{activityViewMode:'Activity view mode',activityPages:'Pages',activityContinuous:'Show all',activityPagination:'Activity pages',previousPage:'Previous',nextPage:'Next',activityPageLabel:'Page {page} of {pages}',activityResultCount:'Showing {visible} of {total} transactions'});
Object.assign(translations.hr,{allTime:'Sve ukupno',appLanguage:'Jezik aplikacije',appTheme:'Tema aplikacije',lightTheme:'Svijetla',darkTheme:'Tamna',editLayout:'Uredi',themeSettingHint:'Prilagodite izgled aplikacije uvjetima rada.',dashboardLayout:'Raspored nadzorne ploče',layoutSettingHint:'Promijenite redoslijed kartica povlačenjem.',openBanking:'OPEN BANKING',syncStatus:'Status sinkronizacije',reviewImportedTransactions:'Pregledajte uvezene transakcije bez potvrđene kategorije.',budgetDataActions:'Uvoz / izvoz budžeta',budgetDataOverline:'PODACI BUDŽETA',budgetDataIntro:'Uvezite promet za kategorizaciju ili preuzmite mjesečni plan grupiran po kategorijama.',budgetImportHint:'Pregledajte CSV, Excel ili CAMT.053 zapise prije potvrde.',budgetExportHint:'Preuzmite limite, potrošnju i iskorištenost po kategorijama.',importBankStatement:'Uvezi bankovni izvod',exportBudgetPlan:'Izvezi plan budžeta',exportInsightsReport:'Izvezi izvješće',goToSavings:'Idi na Štednju',showAllTransactions:'Prikaži sve transakcije'});
Object.assign(translations.en,{appLanguage:'App language',appTheme:'App theme',lightTheme:'Light',darkTheme:'Dark',editLayout:'Edit',themeSettingHint:'Adapt the interface to your working environment.',dashboardLayout:'Dashboard layout',layoutSettingHint:'Change card order with drag and drop.',openBanking:'OPEN BANKING',syncStatus:'Sync status',reviewImportedTransactions:'Review imported transactions without a confirmed category.',budgetDataActions:'Import / export budget',budgetDataOverline:'BUDGET DATA',budgetDataIntro:'Import activity for categorization or download the monthly plan grouped by category.',budgetImportHint:'Review CSV, Excel, or CAMT.053 records before confirming.',budgetExportHint:'Download category limits, spending, and usage.',importBankStatement:'Import bank statement',exportBudgetPlan:'Export budget plan',exportInsightsReport:'Export report',goToSavings:'Go to Savings',showAllTransactions:'Show all transactions'});
Object.assign(translations.hr,{bankAccountSelectionRequired:'Molimo označite banku ili karticu prije nastavka.',unlinkBankTitle:'Prekid veze',unlinkBankQuestion:'Jeste li sigurni da želite prekinuti vezu s ovom bankom/karticom?',unlinkBankConfirm:'Prekini vezu',unlinkBankCancel:'Odustani'});
Object.assign(translations.en,{bankAccountSelectionRequired:'Please select a bank account or card before continuing.',unlinkBankTitle:'Disconnect account',unlinkBankQuestion:'Are you sure you want to disconnect this bank or card?',unlinkBankConfirm:'Disconnect',unlinkBankCancel:'Cancel'});
Object.assign(translations.hr,{markResolved:'Označi kao riješeno',resolveNotificationLabel:'Označi kao riješeno: {title}',notificationResolved:'Obavijest je označena kao riješena.',needsReviewCount:'{count} za pregled',allSavingsDeposits:'Sve uplate',allSavingsDepositsIntro:'Datumi, iznosi, ciljevi i profil svake evidentirane uplate.',unknownSavingsGoal:'Nepoznati cilj'});
Object.assign(translations.en,{markResolved:'Mark as resolved',resolveNotificationLabel:'Mark as resolved: {title}',notificationResolved:'Notification marked as resolved.',needsReviewCount:'{count} to review',allSavingsDeposits:'All deposits',allSavingsDepositsIntro:'Dates, amounts, goals, and the profile for every recorded deposit.',unknownSavingsGoal:'Unknown goal'});
Object.assign(translations.hr,{profileBrandName:'Moj eRačun',profileBrandOrganization:'Elektronički računi d.o.o.',budgetDataActions:'Izvoz budžeta',budgetDataIntro:'Preuzmite limite, potrošnju i iskorištenost grupirane po kategorijama.',exportBudgetPlan:'Izvoz budžeta',exportInsightsReport:'Izvoz izvještaja',savingsStrategyOverline:'STRATEGIJA ŠTEDNJE',savingsStrategyTitle:'Pregled strategije',savingsStrategyIntro:'Provjerite zaštitnu pričuvu, sigurnosni odmak i održiv tempo uplata aktivnog profila.',strategyCurrentCoverage:'Trenutačna pokrivenost',strategyCoverageBody:'Ciljajte na tri do šest mjeseci osnovnih troškova prije povećanja rizičnijih ulaganja.',strategyTargetBuffer:'Mjesečni sigurnosni odmak',strategyBufferBody:'Odmak se računa iz odabranog postotka zaštite i mjesečnog prihoda.',strategyMonthlyContribution:'Planirana mjesečna uplata',strategyContributionBody:'Redovite uplate zadržavaju cilj predvidljivim i štite svakodnevni budžet.',strategyRecommendationTitle:'MER preporuka',strategyRecommendationBody:'Prvo održavajte pričuvu, zatim povećavajte uplate kada mjesečni neto rezultat ostane pozitivan.',strategyBuildReserve:'Izgradite pričuvu',strategyMaintainPace:'Održavajte ritam',strategyDiversify:'Diverzificirajte višak'});
Object.assign(translations.en,{profileBrandName:'Moj eRačun',profileBrandOrganization:'Elektronički računi d.o.o.',budgetDataActions:'Export budget',budgetDataIntro:'Download category limits, spending, and usage grouped by category.',exportBudgetPlan:'Export budget',exportInsightsReport:'Export report',savingsStrategyOverline:'SAVINGS STRATEGY',savingsStrategyTitle:'Strategy overview',savingsStrategyIntro:'Review the active profile’s emergency reserve, risk buffer, and sustainable contribution pace.',strategyCurrentCoverage:'Current coverage',strategyCoverageBody:'Aim for three to six months of essential costs before increasing higher-risk investments.',strategyTargetBuffer:'Monthly safety buffer',strategyBufferBody:'The buffer is calculated from your selected protection rate and monthly income.',strategyMonthlyContribution:'Planned monthly contribution',strategyContributionBody:'Regular contributions keep the goal predictable while protecting the day-to-day budget.',strategyRecommendationTitle:'MER recommendation',strategyRecommendationBody:'Maintain the reserve first, then increase contributions while the monthly net remains positive.',strategyBuildReserve:'Build the reserve',strategyMaintainPace:'Maintain the pace',strategyDiversify:'Diversify the surplus'});
Object.assign(translations.hr,{savedInPeriod:'Ušteđeno u razdoblju',savingsHistorySummary:'Sažetak povijesti štednje',monthlyAverage:'Mjesečni prosjek',bestSavingsMonth:'Najbolji mjesec',savingsTrendUp:'više od prošlog mjeseca',savingsTrendDown:'manje od prošlog mjeseca',savingsTrendFlat:'Jednako kao prošli mjesec',savingsPointLabel:'{month}: {amount}'});
Object.assign(translations.en,{savedInPeriod:'Saved in this period',savingsHistorySummary:'Savings history summary',monthlyAverage:'Monthly average',bestSavingsMonth:'Best month',savingsTrendUp:'more than last month',savingsTrendDown:'less than last month',savingsTrendFlat:'Same as last month',savingsPointLabel:'{month}: {amount}'});
Object.assign(translations.hr,{addExpense:'Dodaj trošak',addExpenseSubmit:'Dodaj trošak',transactionDate:'Datum',transactionDateRequired:'Odaberite valjani datum transakcije.',scheduledTransaction:'Zakazano',scheduledTransactionNotice:'Ova će se transakcija evidentirati {date} i do tada neće utjecati na stanje, budžete ni uvide.',scheduledTransactionSaved:'Transakcija je zakazana za {date}.'});
Object.assign(translations.en,{addExpense:'Add expense',addExpenseSubmit:'Add expense',transactionDate:'Date',transactionDateRequired:'Choose a valid transaction date.',scheduledTransaction:'Scheduled',scheduledTransactionNotice:'This transaction will be posted on {date} and will not affect balances, budgets, or insights before then.',scheduledTransactionSaved:'Transaction scheduled for {date}.'});

Object.assign(translations.hr,{savingsDepositsOnly:'Evidentirane uplate u ciljeve štednje'});
Object.assign(translations.en,{savingsDepositsOnly:'Recorded deposits into savings goals'});
const categoryMeta = {
  food:{ icon:'H', iconId:'icon-utensils', className:'food' },
  transport:{ icon:'P', iconId:'icon-car', className:'transport' },
  shopping:{ icon:'K', iconId:'icon-shopping-cart', className:'shopping' },
  healthBeauty:{ icon:'N', iconId:'icon-heart-pulse', className:'health' },
  utilities:{ icon:'R', iconId:'icon-home', className:'utilities' },
  entertainment:{ icon:'Z', iconId:'icon-ticket', className:'entertainment' },
  other:{ icon:'O', iconId:'icon-receipt', className:'other' }
};
const defaultIncomeCategories = [
  {id:'salary',nameKey:'salary',icon:'P',isCustom:false},
  {id:'gift',nameKey:'gift',icon:'D',isCustom:false},
  {id:'freelance',nameKey:'freelance',icon:'F',isCustom:false},
  {id:'otherIncome',nameKey:'otherIncome',icon:'O',isCustom:false}
];

const initialDemoProfiles = MerDemoData.createProfiles();
const personalDefaults = initialDemoProfiles.personal;
const businessDefaults = initialDemoProfiles.business;

let appState;
try {
  const versionSix = JSON.parse(localStorage.getItem('mer-money-v6') || 'null');
  const stored = JSON.parse(localStorage.getItem('mer-money-v5') || 'null');
  const versionFour = JSON.parse(localStorage.getItem('mer-money-v4') || 'null');
  const legacy = JSON.parse(localStorage.getItem('mer-money-v3') || 'null');
  const migratedPersonal=legacy?{...structuredClone(personalDefaults),...legacy,accountName:personalDefaults.accountName,accountLabel:personalDefaults.accountLabel,initials:personalDefaults.initials,savingsEntries:legacy.savingsEntries||structuredClone(personalDefaults.savingsEntries),recurring:legacy.recurring||structuredClone(personalDefaults.recurring)}:personalDefaults;
  appState = versionSix?.accounts ? versionSix : stored?.accounts ? stored : versionFour?.accounts ? versionFour : MerCore.createAccountStore(migratedPersonal,businessDefaults,{language:legacy?.language||'hr',theme:'light'});
} catch { appState = MerCore.createAccountStore(personalDefaults,businessDefaults,{language:'hr',theme:'light'}); }
if(!appState||typeof appState!=='object'||!appState.accounts||typeof appState.accounts!=='object')appState=MerCore.createAccountStore(structuredClone(personalDefaults),structuredClone(businessDefaults),{language:'hr',theme:'light'});
appState.accounts.personal=appState.accounts.personal&&typeof appState.accounts.personal==='object'?appState.accounts.personal:structuredClone(personalDefaults);
appState.accounts.business=appState.accounts.business&&typeof appState.accounts.business==='object'?appState.accounts.business:structuredClone(businessDefaults);
appState.accounts.personal.profileId='personal';
appState.accounts.business.profileId='business';
appState.activeAccount=appState.activeAccount==='business'?'business':'personal';
appState.version=6;
const safeIdentifier=(value,fallback)=>String(value??fallback).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100)||fallback;
let uniqueSequence=0;
const uniqueId=prefix=>`${prefix}-${Date.now()}-${++uniqueSequence}`;
appState.bankConnections=Array.isArray(appState.bankConnections)?appState.bankConnections.filter(connection=>connection&&typeof connection==='object'&&connection.id&&connection.providerId&&['personal','business'].includes(connection.profileId)).map((connection,index)=>({...connection,id:safeIdentifier(connection.id,`connection-${index}`),providerId:safeIdentifier(connection.providerId,'mock'),accountId:safeIdentifier(connection.accountId,`account-${index}`)})):[];
const supportedCurrencies=new Set(['EUR','USD','GBP','CHF']);
const storedSettings=appState.settings&&typeof appState.settings==='object'?appState.settings:{};
function normalizeLayoutOrders(value={}) {
  const result={};
  Object.entries(value&&typeof value==='object'?value:{}).slice(0,64).forEach(([rawScopeId,grids])=>{
    const scopeId=String(rawScopeId).trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
    if(!scopeId||!grids||typeof grids!=='object')return;
    result[scopeId]={};
    Object.entries(grids).slice(0,24).forEach(([gridId,contexts])=>{
      const safeGridId=String(gridId).trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').slice(0,80);if(!safeGridId||!contexts||typeof contexts!=='object')return;
      const normalized={};
      ['mobile','tablet','desktop','wide'].forEach(context=>{if(!Array.isArray(contexts[context]))return;normalized[context]=[...new Set(contexts[context].filter(id=>typeof id==='string'&&id.trim()&&id.length<=160).map(id=>id.trim()))].slice(0,40);});
      if(Object.keys(normalized).length)result[scopeId][safeGridId]=normalized;
    });
    if(!Object.keys(result[scopeId]).length)delete result[scopeId];
  });
  return result;
}
function normalizeAppSettings(settings={}){const currency=String(settings.currency||'EUR').toUpperCase(),dateFormat=['locale','iso','us'].includes(settings.dateFormat)?settings.dateFormat:'locale';let timezone=String(settings.timezone||'Europe/Zagreb');try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format();}catch{timezone='Europe/Zagreb';}return {currency:supportedCurrencies.has(currency)?currency:'EUR',dateFormat,timezone,hideBalances:Boolean(settings.hideBalances),layoutOrders:normalizeLayoutOrders(settings.layoutOrders)};}
appState.settings=normalizeAppSettings(storedSettings);
appState.mfa=MerSecurity.createMfaMethodState({method:appState.mfa?.method||(appState.mfa?.secret?'authenticator':null),enabled:false,secret:null,recoveryCodeHashes:[],...(appState.mfa&&typeof appState.mfa==='object'?appState.mfa:{})});
appState.mfaByUser=Object.fromEntries(Object.entries(appState.mfaByUser&&typeof appState.mfaByUser==='object'?appState.mfaByUser:{}).filter(([userId,value])=>typeof userId==='string'&&userId.length<=120&&value&&typeof value==='object').slice(-24).map(([userId,value])=>[userId,MerSecurity.createMfaMethodState(value)]));
appState.mfaLegacyOwner=typeof appState.mfaLegacyOwner==='string'&&appState.mfaLegacyOwner.length<=120?appState.mfaLegacyOwner:null;
const legacyMfaSnapshot=MerSecurity.createMfaMethodState(appState.mfa);
const emptyMfaState=()=>MerSecurity.createMfaMethodState({});
const normalizeMfaUserId=value=>typeof value==='string'&&value.trim()&&value.length<=120?value.trim():null;
function sessionCanOwnLegacyMfa(session,userId){
  if(appState.mfaLegacyOwner)return appState.mfaLegacyOwner===userId;
  try{
    const users=JSON.parse(localStorage.getItem(MerAuth.USERS_KEY)||'[]');
    if(Array.isArray(users)&&users.length===1)return users[0]?.id===userId;
    return Array.isArray(users)&&users.length===0&&Boolean(session?.demo)&&userId==='demo-user';
  }catch{return false;}
}
let activeMfaUserId=null;
window.MerMfaState=Object.freeze({
  activate(session){
    const userId=normalizeMfaUserId(session?.userId);
    if(!userId){this.deactivate();return {userId:null,changed:false,state:emptyMfaState()};}
    let changed=activeMfaUserId!==userId;
    let userMfa=appState.mfaByUser[userId];
    if(!userMfa){
      const hasMappedMfa=Object.values(appState.mfaByUser).some(value=>MerSecurity.createMfaMethodState(value).enabled);
      const canMigrateLegacy=legacyMfaSnapshot.enabled&&!hasMappedMfa&&sessionCanOwnLegacyMfa(session,userId);
      userMfa=canMigrateLegacy?MerSecurity.createMfaMethodState(legacyMfaSnapshot):emptyMfaState();
      appState.mfaByUser[userId]=userMfa;
      if(canMigrateLegacy)appState.mfaLegacyOwner=userId;
      changed=true;
    }
    activeMfaUserId=userId;
    appState.mfa=MerSecurity.createMfaMethodState(userMfa);
    return {userId,changed,state:appState.mfa};
  },
  syncActive(){
    if(!activeMfaUserId)return false;
    const normalized=MerSecurity.createMfaMethodState(appState.mfa);
    appState.mfa=normalized;
    appState.mfaByUser[activeMfaUserId]=normalized;
    return true;
  },
  deactivate(){
    if(activeMfaUserId)this.syncActive();
    activeMfaUserId=null;
    appState.mfa=emptyMfaState();
  },
  activeUserId(){return activeMfaUserId;}
});

const MFA_UNLOCK_PROOF_KEY='mer-mfa-unlock-proof-v2';
const MFA_UNLOCK_PROOF_LIFETIME=12*60*60*1000;
function readMfaUnlockProof(){try{const value=JSON.parse(sessionStorage.getItem(MFA_UNLOCK_PROOF_KEY)||'null');return value&&typeof value==='object'?value:null;}catch{return null;}}
window.MerMfaUnlock=Object.freeze({
  mark(session=window.MerAuthProvider?.currentSession?.()){
    const sessionId=typeof session?.sessionId==='string'?session.sessionId:null,userId=normalizeMfaUserId(session?.userId);
    if(!sessionId||!userId){this.clear();return false;}
    const verifiedAt=Date.now();
    try{sessionStorage.setItem(MFA_UNLOCK_PROOF_KEY,JSON.stringify({sessionId,userId,verifiedAt,expiresAt:Math.min(Number(session.expiresAt)||verifiedAt+MFA_UNLOCK_PROOF_LIFETIME,verifiedAt+MFA_UNLOCK_PROOF_LIFETIME)}));sessionStorage.removeItem('mer-mfa-unlocked');return true;}catch{return false;}
  },
  isValid(session=window.MerAuthProvider?.currentSession?.()){
    const proof=readMfaUnlockProof(),sessionId=typeof session?.sessionId==='string'?session.sessionId:null,userId=normalizeMfaUserId(session?.userId),now=Date.now();
    const valid=Boolean(proof&&sessionId&&userId&&proof.sessionId===sessionId&&proof.userId===userId&&Number.isFinite(Number(proof.verifiedAt))&&Number.isFinite(Number(proof.expiresAt))&&Number(proof.verifiedAt)>=Number(session?.issuedAt||0)&&Number(proof.expiresAt)>now);
    if(!valid)this.clear();
    return valid;
  },
  clear(){try{sessionStorage.removeItem(MFA_UNLOCK_PROOF_KEY);sessionStorage.removeItem('mer-mfa-unlocked');}catch{}},
  key:MFA_UNLOCK_PROOF_KEY
});
const validStoredDate=value=>{const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})/);if(!match)return false;const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])));return date.getUTCFullYear()===Number(match[1])&&date.getUTCMonth()===Number(match[2])-1&&date.getUTCDate()===Number(match[3]);};
const safeFinite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
function normalizeProfile(profile,fallbackProfile=personalDefaults) {
  const chosenFallback=fallbackProfile&&typeof fallbackProfile==='object'&&Array.isArray(fallbackProfile.categories)?fallbackProfile:(profile?.accountLabel==='businessAccount'?businessDefaults:personalDefaults);
  const fallback=structuredClone(chosenFallback);
  profile.accountLabel=fallback.accountLabel;
  profile.accountName=fallback.accountName;
  profile.initials=fallback.initials;
  profile.income=Math.max(0,safeFinite(profile.income,fallback.income));
  profile.bills=Math.max(0,safeFinite(profile.bills,fallback.bills));
  profile.savingsTarget=Math.max(0,safeFinite(profile.savingsTarget,fallback.savingsTarget));
  profile.guard=Math.max(0,Math.min(1,safeFinite(profile.guard,fallback.guard)));
  profile.availableBalance=safeFinite(profile.availableBalance,fallback.availableBalance);
  const rawCategories=Array.isArray(profile.categories)?profile.categories:[];
  const seenCategoryIds=new Set();
  profile.categories=rawCategories.filter(category=>category&&typeof category==='object'&&String(category.id||'').trim()).map(category=>({...category,id:safeIdentifier(category.id,'category'),limit:Math.max(0,safeFinite(category.limit,0)),spent:Math.max(0,safeFinite(category.spent,0)),name:category.name?String(category.name).trim().slice(0,40):category.name,icon:category.icon?String(category.icon).slice(0,2):category.icon})).filter(category=>!seenCategoryIds.has(category.id)&&seenCategoryIds.add(category.id));
  if(!profile.categories.length)profile.categories=structuredClone(fallback.categories);
  const rawIncomeCategories=Array.isArray(profile.incomeCategories)?profile.incomeCategories:[];
  const seenIncomeIds=new Set();
  profile.incomeCategories=rawIncomeCategories.filter(category=>category&&typeof category==='object'&&String(category.id||'').trim()).map(category=>({...category,id:safeIdentifier(category.id,'income-category'),name:category.name?String(category.name).trim().slice(0,40):category.name,icon:category.icon?String(category.icon).slice(0,2):category.icon})).filter(category=>!seenIncomeIds.has(category.id)&&seenIncomeIds.add(category.id));
  if(!profile.incomeCategories.length)profile.incomeCategories=structuredClone(defaultIncomeCategories);
  const expenseFallback=profile.categories.find(category=>category.id==='other')||profile.categories[0];
  const incomeFallback=profile.incomeCategories.find(category=>category.id==='otherIncome')||profile.incomeCategories[0];
  profile.transactions=(Array.isArray(profile.transactions)?profile.transactions:[]).filter(transaction=>transaction&&typeof transaction==='object'&&validStoredDate(transaction.date)&&Number.isFinite(Number(transaction.amount))&&Number(transaction.amount)!==0).map((transaction,index)=>{const type=MerCore.transactionType(transaction),available=type==='income'?profile.incomeCategories:profile.categories,fallbackCategory=type==='income'?incomeFallback:expenseFallback;return {...transaction,id:safeIdentifier(transaction.id,`restored-${index}-${MerCore.stableTransactionHash([transaction.date,transaction.name,transaction.amount])}`),type,name:String(transaction.name||'Transakcija').trim().slice(0,100)||'Transakcija',amount:Number(transaction.amount),category:available.some(category=>category.id===transaction.category)?transaction.category:fallbackCategory.id,source:String(transaction.source||tSourceManual()).slice(0,100),sourceType:['manual','auto','import','round-up'].includes(transaction.sourceType)?transaction.sourceType:'manual',needsReview:Boolean(transaction.needsReview)};});
  if(profile.accountLabel==='personalAccount'&&!profile.categories.some(category=>category.id==='healthBeauty')){
    profile.categories.forEach(category=>{const limits={food:520,transport:260,shopping:370,entertainment:180,other:190};if(limits[category.id]!==undefined)category.limit=limits[category.id];});
    profile.categories.splice(Math.min(3,profile.categories.length),0,{id:'healthBeauty',spent:0,limit:80},{id:'utilities',spent:0,limit:470});
    profile.transactions.forEach(transaction=>{const description=String(transaction.name||'').toLocaleLowerCase('hr');if(transaction.category==='shopping'&&/(^|\s)dm(\s|$)|müller|bipa/.test(description))transaction.category='healthBeauty';if(transaction.category==='other'&&/račun|hep|holding|telekom|a1|telemach/.test(description))transaction.category='utilities';});
  }
  profile.automationRules=(Array.isArray(profile.automationRules)?profile.automationRules:[]).filter(rule=>rule&&typeof rule==='object'&&String(rule.keyword||'').trim()).map((rule,index)=>{const type=rule.type==='income'?'income':'expense',available=type==='income'?profile.incomeCategories:profile.categories,fallbackCategory=type==='income'?incomeFallback:expenseFallback;return {...rule,id:safeIdentifier(rule.id,`rule-${index}`),keyword:String(rule.keyword).trim().slice(0,60),type,category:available.some(category=>category.id===rule.category)?rule.category:fallbackCategory.id,enabled:rule.enabled!==false};});
  const fallbackDue=new Date();fallbackDue.setFullYear(fallbackDue.getFullYear()+1);
  profile.goalBuckets=(Array.isArray(profile.goalBuckets)?profile.goalBuckets:[]).filter(goal=>goal&&typeof goal==='object'&&String(goal.name||'').trim()).map((goal,index)=>({...goal,id:safeIdentifier(goal.id,`goal-${index}`),name:String(goal.name).trim().slice(0,40),current:Math.max(0,safeFinite(goal.current,0)),target:Math.max(1,safeFinite(goal.target,1)),dueDate:goal.dueDate&&validStoredDate(goal.dueDate)?String(goal.dueDate).slice(0,10):'',primary:index===0?goal.primary!==false:Boolean(goal.primary),roundUpsEnabled:goal.roundUpsEnabled===undefined?index===0:Boolean(goal.roundUpsEnabled)}));
  if(!profile.goalBuckets.length)profile.goalBuckets=[{id:`goal-${profile.accountLabel==='businessAccount'?'business':'personal'}-reserve`,name:profile.accountLabel==='businessAccount'?'Poslovna rezerva':'Fond za hitne slučajeve',target:Math.max(1,safeFinite(profile.savingsGoal,10000)),current:Math.max(0,safeFinite(profile.savingsBalance,0)),dueDate:fallbackDue.toISOString().slice(0,10),icon:'◎',primary:true,roundUpsEnabled:true}];
  if(!profile.goalBuckets.some(goal=>goal.primary))profile.goalBuckets[0].primary=true;
  const primaryGoalId=profile.goalBuckets.find(goal=>goal.primary)?.id||profile.goalBuckets[0].id;
  profile.savingsEntries=(Array.isArray(profile.savingsEntries)?profile.savingsEntries:[]).filter(entry=>entry&&typeof entry==='object'&&validStoredDate(entry.date)&&Number.isFinite(Number(entry.amount))&&Number(entry.amount)>0).map((entry,index)=>({...entry,id:safeIdentifier(entry.id,`saving-${index}`),amount:Number(entry.amount),note:String(entry.note||'Uplata u štednju').trim().slice(0,80),goalId:profile.goalBuckets.some(goal=>goal.id===entry.goalId)?entry.goalId:primaryGoalId}));
  profile.savingsHistory=(Array.isArray(profile.savingsHistory)?profile.savingsHistory:[]).map(value=>Math.max(0,safeFinite(value,0))).slice(-12);
  if(!profile.savingsHistory.length)profile.savingsHistory=Array(8).fill(0);
  profile.dismissedNotifications=Object.fromEntries(Object.entries(profile.dismissedNotifications&&typeof profile.dismissedNotifications==='object'?profile.dismissedNotifications:{}).filter(([key,value])=>typeof key==='string'&&key.length<=120&&typeof value==='string'&&value.length<=120).slice(-100));
  profile.recurring=(Array.isArray(profile.recurring)?profile.recurring:[]).filter(rule=>rule&&typeof rule==='object'&&String(rule.name||'').trim()&&validStoredDate(rule.startDate)&&Number.isFinite(Number(rule.amount))&&Number(rule.amount)>0&&Number(rule.day)>=1&&Number(rule.day)<=31).map((rule,index)=>({...rule,id:safeIdentifier(rule.id,`recurring-${index}`),name:String(rule.name).trim().slice(0,80),amount:Number(rule.amount),day:Math.floor(Number(rule.day)),startDate:String(rule.startDate).slice(0,10),lastProcessed:validStoredDate(rule.lastProcessed)?String(rule.lastProcessed).slice(0,10):null,category:profile.categories.some(category=>category.id===rule.category)?rule.category:expenseFallback.id,enabled:rule.enabled!==false}));
  profile.savingsBalance=profile.goalBuckets.reduce((sum,goal)=>sum+goal.current,0);
  return profile;
}
function tSourceManual(){return 'Manual';}
appState.accounts.personal=normalizeProfile(appState.accounts.personal,personalDefaults);
appState.accounts.business=normalizeProfile(appState.accounts.business,businessDefaults);
function dateInTimezone(now=new Date(),timezone=appState.settings.timezone){const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:timezone}).formatToParts(now);const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));return `${values.year}-${values.month}-${values.day}`;}
let appReferenceDate = dateInTimezone();
function alignSavingsHistory(profile){const currentMonth=appReferenceDate.slice(0,7),previous=String(profile.savingsHistoryReferenceMonth||currentMonth);if(/^\d{4}-\d{2}$/.test(previous)&&previous<currentMonth){const [oldYear,oldMonth]=previous.split('-').map(Number),[newYear,newMonth]=currentMonth.split('-').map(Number),elapsed=Math.max(0,(newYear-oldYear)*12+newMonth-oldMonth);for(let index=0;index<Math.min(12,elapsed);index+=1)profile.savingsHistory.push(0);profile.savingsHistory=profile.savingsHistory.slice(-12);}profile.savingsHistoryReferenceMonth=currentMonth;}
Object.values(appState.accounts).forEach(alignSavingsHistory);
const reactiveStore = MerStateStore.createStore(appState,{referenceDate:appReferenceDate});
let state = reactiveStore.getActiveProfile();
let currentLang = appState.language === 'en' ? 'en' : 'hr';
let currentTheme = appState.theme === 'dark' ? 'dark' : 'light';
let reactiveUiReady = false;
let activeMonth = Number(appReferenceDate.slice(5,7))-1;
let activeView = 'overview';
let assessmentStep = 1;
let editingCategoryId = null;
let editingTransactionId = null;
let editingSavingsId = null;
let editingRecurringId = null;
let editingIncomeCategoryId = null;
let transactionType = 'expense';
let insightsTimeframe = 'monthly';
let activeInsightDetail = null;
let activityReviewOnly = false;
const ACTIVITY_PAGE_SIZE = 8;
let activityPage = 1;
let activityViewMode = 'pages';
let selectedBankProviderId = null;
let bankConnectionStep = 'overview';
let pendingBankUnlinkId = null;
let bankSyncInProgress = false;
let returnToBudgetManager = false;

const t = (key, values = {}) => {
  let text = translations[currentLang][key] ?? translations.hr[key] ?? key;
  Object.entries(values).forEach(([name,value]) => { text = text.replaceAll(`{${name}}`, value); });
  return text;
};
const locale = () => currentLang === 'hr' ? 'hr-HR' : 'en-IE';
const currency = (value, options = {}) => MerCore.formatCurrency(value,{locale:locale(),currency:appState.settings.currency||'EUR',...(options&&typeof options==='object'?options:{})});
const categoryLimitCurrency = value => currency(value,{categoryBudgetLimit:true});
const number = (value, digits = 1) => {const amount=Number(value);return new Intl.NumberFormat(locale(), { maximumFractionDigits:digits }).format(Number.isFinite(amount)?amount:0);};
const categoryName = id => { const cat=state?.categories?.find(item=>item.id===id);return cat?.name || t(id); };
function inferredCategoryIconId(cat) {
  const descriptor=`${cat?.id||''} ${cat?.name||''}`.toLocaleLowerCase('hr-HR');
  if(/zdrav|njeg|ljek|farmac|bipa|müller|muller|\bdm\b/.test(descriptor))return 'icon-heart-pulse';
  if(/režij|rezij|stanov|hep|holding|vodovod|čistoć|cistoc|telekom|telemach/.test(descriptor))return 'icon-home';
  if(/goriv|fuel|ina|petrol|lukoil|crodux|shell/.test(descriptor))return 'icon-fuel';
  if(/prijevoz|transport|zet|uber|bolt|\bhž\b|\bhz\b|\bhac\b/.test(descriptor))return 'icon-car';
  if(/hran|namir|restoran|dostav|wolt|glovo|konzum|lidl|spar|plodine|studenac|tommy|eurospin|kaufland/.test(descriptor))return 'icon-utensils';
  if(/kupovin|shopping|amazon|aliexpress|zara|h&m|ikea|tisak/.test(descriptor))return 'icon-shopping-cart';
  if(/zabav|entertain|kino|event|netflix|spotify/.test(descriptor))return 'icon-ticket';
  return null;
}
const categoryVisual = cat => categoryMeta[cat?.id] || { icon:cat?.icon || (cat?.name || '?').slice(0,1).toUpperCase(), iconId:inferredCategoryIconId(cat), className:'custom' };
const incomeCategoryName = id => { const cat=state?.incomeCategories?.find(item=>item.id===id);return cat?.name || t(cat?.nameKey||id); };
const incomeCategoryVisual = cat => ({icon:cat?.icon||(incomeCategoryName(cat?.id||'otherIncome').slice(0,1).toUpperCase()),iconId:'icon-wallet',className:'income-category'});
const categoryIconMarkup = visual => visual?.iconId
  ? `<svg aria-hidden="true" focusable="false"><use href="#${visual.iconId}"></use></svg>`
  : escapeHtml(visual?.icon||'?');
reactiveStore.subscribe(event => {
  appState=event.state;
  state=event.activeProfile;
  window.MerMfaState?.syncActive?.();
  try{localStorage.setItem('mer-money-v6',JSON.stringify(appState));}catch(error){window.MerRuntime?.report?.(error,{silent:true});}
  if(reactiveUiReady&&event.reason!=='layout-reorder')renderAll();
});
const save = (reason='state-change') => {
  appState.language=currentLang;
  appState.theme=currentTheme;
  appState.accounts[appState.activeAccount]=state;
  reactiveStore.commit(reason);
};

function getPlan() { return state.derived?.financials || reactiveStore.snapshot()?.derived?.financials || MerCore.FinancialEngine.calculate(state,appReferenceDate,{openingBalance:state.financialOpeningBalance,savingsBalance:state.savingsBalance}); }
function derivedTotals(timeframe='monthly') { return state.derived?.totalsByTimeframe?.[timeframe] || MerCore.transactionTotals(state.transactions,timeframe,appReferenceDate); }

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-i18n-placeholder]').forEach(el => el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)));
  $$('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === currentLang)));
  const chartMonth=new Intl.DateTimeFormat(locale(),{month:'long'}).format(new Date(`${appReferenceDate.slice(0,7)}-01T12:00:00`));
  $('#chartTitle').textContent = currentLang === 'hr' ? `Tempo potrošnje u ${chartMonth}` : `${chartMonth} spending pace`;
  $('#chartDesc').textContent = currentLang === 'hr' ? 'Kumulativna stvarna potrošnja uspoređena s planom.' : 'Cumulative actual spending compared with the plan.';
  document.title = currentLang === 'hr' ? 'mer Moj novac' : 'mer My money';
}

function applyTheme() {
  document.documentElement.dataset.theme=currentTheme;
  const themeToggle=$('#themeToggle');
  if(!themeToggle)return;
  themeToggle.setAttribute('aria-label',t('appTheme'));
  $$('[data-theme-choice]',themeToggle).forEach(button=>{
    const active=button.dataset.themeChoice===currentTheme;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
}

function renderAccountContext() {
  $('#accountAvatar').textContent=state.initials;
  $('#accountName').textContent=state.accountName;
  $('#accountLabel').textContent=t(state.accountLabel);
  $$('[data-account]').forEach(button=>{
    const profile=appState.accounts[button.dataset.account];
    if(!profile)return;
    const active=button.dataset.account===appState.activeAccount;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
    button.querySelector('.avatar').textContent=profile.initials;
    button.querySelector('strong').textContent=profile.accountName;
    button.querySelector('small').textContent=t(profile.accountLabel);
  });
  renderModuleTitle();
}

function renderSystemDate(now=new Date()) {
  const timezone=appState.settings.timezone||'Europe/Zagreb';
  const nextReferenceDate=dateInTimezone(now,timezone);
  if(nextReferenceDate!==appReferenceDate){appReferenceDate=nextReferenceDate;Object.values(appState.accounts).forEach(alignSavingsHistory);queueMicrotask(()=>reactiveStore.setReferenceDate(nextReferenceDate));}
  const compactDate=window.matchMedia('(max-width:560px)').matches;
  const tabletDate=!compactDate&&window.matchMedia('(max-width:1024px)').matches;
  const dateOptions=compactDate
    ? {day:'2-digit',month:'2-digit',year:'2-digit',timeZone:timezone}
    : tabletDate
      ? {day:'numeric',month:'short',year:'numeric',timeZone:timezone}
      : {weekday:'short',day:'numeric',month:'long',year:'numeric',timeZone:timezone};
  const dateLabel=new Intl.DateTimeFormat(locale(),dateOptions).format(now);
  $('#systemDate').textContent=dateLabel;$('#systemDate').dateTime=now.toISOString();
  activeMonth=Number(appReferenceDate.slice(5,7))-1;
  renderModuleTitle(now);
}

function renderMonth() {
  const date = new Date(`${appReferenceDate.slice(0,4)}-${String(activeMonth+1).padStart(2,'0')}-01T12:00:00`);
  $('#budgetMonthOverline').textContent = new Intl.DateTimeFormat(locale(), { month:'long' }).format(date).toUpperCase();
  renderSystemDate();
}

function renderOverview() {
  const plan = getPlan();
  const percent = Math.round(plan.spentPercent);
  const goalPercent = Math.round(MerCore.ratioPercent(state.savingsBalance,state.savingsGoal,100));
  const monthName = new Intl.DateTimeFormat(locale(), { month:'long' }).format(new Date(`${appReferenceDate.slice(0,4)}-${String(activeMonth+1).padStart(2,'0')}-01T12:00:00`));
  $('#availableBalance').textContent = currency(state.availableBalance);
  $('#availableBalance').classList.toggle('negative-value',state.availableBalance<0);
  $('#availableBalance').classList.toggle('positive-value',state.availableBalance>0);
  $('#spentValue').textContent = currency(state.spent);
  const monthlySavings=state.derived?.monthlyContributions||0;
  $('#savedValue').textContent = currency(monthlySavings);
  $('#savedValue').classList.toggle('negative-value',monthlySavings<0);
  $('#savedValue').classList.toggle('positive-value',monthlySavings>0);
  $('#tipSavings').textContent = currency(state.savingsTarget, true);
  $('#chartSpent').textContent = currency(state.spent, true);
  $('#budgetPercent').textContent = t('budgetOf', { percent, budget:currency(plan.monthlyBudget, true) });
  $('#budgetProgress').style.width = `${Math.min(100, percent)}%`;
  $('#budgetProgressTrack').setAttribute('aria-valuenow', Math.min(100, percent));
  $('#budgetProgressTrack').setAttribute('aria-valuetext',percent>100?t('budgetOverageExact',{percent,amount:currency(Math.max(0,state.spent-plan.monthlyBudget),true)}):t('budgetOf',{percent,budget:currency(plan.monthlyBudget,true)}));
  const totalThreshold=MerCore.budgetThreshold(state.spent,plan.monthlyBudget);
  $('#budgetProgressTrack').className=`progress-track threshold-${totalThreshold.level}${percent>100?' over-cap':''}`;
  $('#safeDaily').textContent = currency(plan.safeDaily, true);
  $('#safeRemaining').textContent = currency(plan.safeRemaining);
  $('#safeDaily').classList.toggle('negative-value',plan.safeDaily<0);
  $('#safeRemaining').classList.toggle('negative-value',plan.safeRemaining<0);
  $('#safePeriod').textContent = t('untilEndMonth', { month:monthName });
  $('#daysRemaining').textContent = t('daysRemaining', { days:plan.days });
  $('#safeRing').style.setProperty('--ring-value', plan.safePercent);
  $('#safeRing').classList.toggle('danger',plan.safeRemaining<0);
  const guard = $('#guardStatus');
  guard.classList.toggle('danger', plan.safeRemaining<0);
  $('strong', guard).textContent = t(plan.safeRemaining<0 ? 'overBudget' : 'withinBudget');
  $('#goalCurrent').textContent = currency(state.savingsBalance, true);
  $('#goalOf').textContent = t('goalOf', { target:currency(state.savingsGoal, true) });
  $('#goalPercent').textContent = `${goalPercent}%`;
  $('#goalProgress').style.width = `${goalPercent}%`;
  $('#goalProgressTrack').setAttribute('aria-valuenow', goalPercent);
  $('#goalDeposit').textContent = currency(state.savingsTarget, true);
  $('#goalFinish').textContent = savingsFinishDate();
  $('#calcIncome').textContent = currency(plan.monthlyIncome, true);
  $('#calcBills').textContent = `−${currency(state.bills, true)}`;
  $('#calcSavings').textContent = `−${currency(state.savingsTarget, true)}`;
  $('#calcBuffer').textContent = `−${currency(plan.buffer, true)}`;
  $('#calcBudget').textContent = currency(plan.spendablePool, true);
  $('#calcSpent').textContent = `−${currency(state.spent)}`;
  $('#calcSafe').textContent = currency(plan.safeRemaining);
  renderSpendingPaceChart();
}

function compactChartCurrency(value) {
  const amount=Number(value)||0;
  if(Math.abs(amount)<.005)return currency(0);
  return new Intl.NumberFormat(locale(),{style:'currency',currency:appState.settings.currency||'EUR',notation:'compact',minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
}

function renderSpendingPaceChart() {
  const svg=$('#overviewDetailsModal .line-chart svg');if(!svg)return;
  const plan=getPlan();
  const series=state.derived?.spendingSeries||MerCore.cumulativeSpendingSeries(state.transactions,appReferenceDate,plan.monthlyBudget);
  if(!series.length)return;
  const actual=series.filter(item=>item.actual!==null),values=series.map(item=>item.planned).concat(actual.map(item=>item.actual));
  const domain=MerCore.chartDomain(values,{padding:.06});
  const x=day=>48+(day-1)/Math.max(1,series.length-1)*592;
  const y=value=>142-MerCore.scaleChartValue(value,domain,124);
  const path=points=>points.map((point,index)=>`${index?'L':'M'}${x(point.day).toFixed(2)} ${y(point.value).toFixed(2)}`).join(' ');
  const plannedPoints=series.map(item=>({day:item.day,value:item.planned}));
  const actualPoints=actual.map(item=>({day:item.day,value:item.actual}));
  $('.planned-line',svg).setAttribute('d',path(plannedPoints));
  $('.actual-line',svg).setAttribute('d',path(actualPoints));
  const area=$('.actual-area',svg);area.setAttribute('d',actualPoints.length?`${path(actualPoints)} L${x(actualPoints.at(-1).day).toFixed(2)} 142 L${x(actualPoints[0].day).toFixed(2)} 142 Z`:'');
  const last=actualPoints.at(-1)||{day:1,value:0},todayX=x(last.day),todayY=y(last.value);
  const todayLine=$('.today-line',svg),todayDot=$('.today-dot',svg),todayLabel=$('.today-label',svg);
  todayLine.setAttribute('x1',todayX);todayLine.setAttribute('x2',todayX);todayDot.setAttribute('cx',todayX);todayDot.setAttribute('cy',todayY);todayLabel.setAttribute('x',todayX);
  const axisLabels=$$('.axis-labels text',svg);
  [domain.max,domain.max*2/3,domain.max/3].forEach((value,index)=>{if(axisLabels[index])axisLabels[index].textContent=compactChartCurrency(value);});
  const dayIndexes=[1,Math.max(1,Math.round(series.length*.25)),Math.max(1,Math.round(series.length*.5)),Math.max(1,Math.round(series.length*.75)),series.length];
  dayIndexes.forEach((day,index)=>{const label=axisLabels[index+3];if(label){label.textContent=`${day}. ${new Date(`${appReferenceDate.slice(0,7)}-01T12:00:00`).getMonth()+1}.`;label.setAttribute('x',Math.max(40,Math.min(606,x(day)-8)));}});
  const plannedToday=series[last.day-1]?.planned||0,delta=plannedToday-last.value,status=$('#overviewDetailsModal .chart-summary .status-pill');
  if(status)status.textContent=currentLang==='hr'?`${currency(Math.abs(delta),true)} ${delta>=0?'manje':'više'} od plana`:`${currency(Math.abs(delta),true)} ${delta>=0?'below':'above'} plan`;
}

function levelClass(percent) { return `threshold-${percent>=100?'red':percent>=80?'yellow':'green'}`; }
function thresholdMessage(percent) { return percent>=100?t('budgetLimitReached'):percent>=80?t('budgetLimitNear'):''; }

function renderBudgetLists() {
  const overviewCategories = state.categories.slice(0, 3);
  $('#budgetList').innerHTML = overviewCategories.map(cat => {
    const pct = Math.round(state.derived?.categoryMetrics?.[cat.id]?.percent ?? MerCore.budgetThreshold(cat.spent,cat.limit).percent);
    const meta = categoryVisual(cat);
    const overage=Math.max(0,cat.spent-cat.limit),status=pct>=100?t('budgetOverageExact',{percent:pct,amount:currency(overage,true)}):thresholdMessage(pct);
    return `<div class="budget-item${pct>100?' is-over-budget':''}"><div class="budget-item-header"><span class="category-icon ${meta.className}">${categoryIconMarkup(meta)}</span><div><div class="budget-item-title"><strong>${escapeHtml(categoryName(cat.id))}</strong><span>${t('usedOf',{spent:currency(cat.spent),limit:categoryLimitCurrency(cat.limit)})}</span></div><div class="budget-bar${pct>100?' over-cap':''}"><span class="${levelClass(pct)}" style="width:${Math.min(100,pct)}%"></span></div>${pct>=80?`<small class="threshold-warning ${pct>=100?'is-red overage-label':''}">${status}</small>`:''}</div><span class="budget-percent">${pct}%</span></div></div>`;
  }).join('');
}

function renderBudgetView() {
  const plan = getPlan();
  const allocated = state.categories.reduce((sum,cat) => sum + Math.round(cat.limit * 100), 0) / 100;
  const difference = MerCore.roundMoney(plan.monthlyBudget - allocated);
  const allocationPercent = plan.monthlyBudget>0?Math.round(MerCore.ratioPercent(allocated,plan.monthlyBudget)):allocated>0?100:0;
  $('#fullBudgetValue').textContent = currency(plan.monthlyBudget, true);
  $('#fullRemainingValue').textContent = currency(plan.safeRemaining);
  $('#fullRemainingValue').classList.toggle('negative-value',plan.safeRemaining<0);
  $('[data-layout-card="budget-remaining"]').classList.toggle('is-negative',plan.safeRemaining<0);
  $('#remainingStatus').className=`delta ${plan.safeRemaining<0?'danger':'positive'}`;
  $('#remainingStatus span').textContent=t(plan.safeRemaining<0?'overBudget':'protectedCommitments');
  $('#allocatedValue').textContent = currency(allocated, true);
  $('#unallocatedValue').textContent = difference >= 0 ? t('allocated',{amount:currency(difference,true)}) : t('overAllocated',{amount:currency(Math.abs(difference),true)});
  $('[data-layout-card="budget-allocation"]').classList.toggle('is-over-allocated',difference<0);
  $('#allocationStatus').textContent = t('allocationPercent',{percent:allocationPercent});
  $('#allocationProgress').style.width = `${Math.min(100,allocationPercent)}%`;
  $('.allocation-bar').classList.toggle('over', allocationPercent > 100);
  $('#allocationCopy').textContent = t('allocationCopy',{allocated:currency(allocated,true),budget:currency(plan.monthlyBudget,true)});
  $('#budgetTable').innerHTML = state.categories.map(cat => budgetCategoryRow(cat)).join('');
  const overspent=state.categories.filter(cat=>cat.spent>cat.limit+.005),donors=state.categories.filter(cat=>cat.limit>cat.spent+.005),overAllocated=difference<-.005,recovery=$('#budgetRecovery');
  const recoveryFingerprint=notificationFingerprint([overAllocated?'allocation':'category',Math.round(Math.abs(difference)*100),...overspent.map(cat=>`${cat.id}:${Math.round(cat.spent*100)}:${Math.round(cat.limit*100)}`).sort()]);
  const recoveryItem={key:'budget-recovery',fingerprint:recoveryFingerprint};
  recovery.hidden=(!overAllocated&&!overspent.length)||isNotificationResolved(recoveryItem);
  $('#resolveBudgetRecovery').dataset.notificationKey=recoveryItem.key;
  $('#resolveBudgetRecovery').dataset.notificationFingerprint=recoveryItem.fingerprint;
  $('#autoBalanceBudget').hidden=!overAllocated;
  $('#openBudgetTransfer').hidden=!overspent.length||!donors.length;
  if(overAllocated){$('#budgetRecoveryTitle').textContent=t('budgetRecoveryOverTitle');$('#budgetRecoveryCopy').textContent=t('budgetRecoveryOverCopy',{amount:currency(Math.abs(difference),true)});}
  else if(overspent.length){$('#budgetRecoveryTitle').textContent=t('budgetRecoveryCategoryTitle');$('#budgetRecoveryCopy').textContent=t('budgetRecoveryCategoryCopy');}
  if($('#budgetCategoriesModal').open)renderBudgetCategoryManager();
}

function budgetCategoryPercent(cat) { return Math.round(state.derived?.categoryMetrics?.[cat.id]?.percent ?? MerCore.budgetThreshold(cat.spent,cat.limit).percent); }

function budgetCategoryRow(cat, manager=false) {
  const pct=budgetCategoryPercent(cat),meta=categoryVisual(cat),remaining=Math.max(0,cat.limit-cat.spent),overage=Math.max(0,cat.spent-cat.limit),name=categoryName(cat.id),safeId=escapeHtml(cat.id),safeName=escapeHtml(name),status=pct>=100?t('budgetOverageExact',{percent:pct,amount:currency(overage,true)}):pct>=80?thresholdMessage(pct):`${currency(remaining,true)} ${currentLang==='hr'?'preostalo':'remaining'}`;
  return `<div class="budget-row${manager?' budget-manager-row':''}${pct>100?' is-over-budget':''}"><div class="budget-category"><span class="category-icon ${meta.className}">${categoryIconMarkup(meta)}</span><div><strong>${safeName}</strong><small class="${pct>=80?'threshold-warning':''}${pct>=100?' overage-label':''}">${status}</small></div></div><div class="budget-row-progress"><div class="budget-bar${pct>100?' over-cap':''}"><span class="${levelClass(pct)}" style="width:${Math.min(100,pct)}%"></span></div><span class="budget-percent">${pct}%</span></div><div class="budget-row-value">${currency(cat.spent)} / ${categoryLimitCurrency(cat.limit)}</div><button type="button" class="icon-button small edit-budget" data-edit-budget="${safeId}" aria-label="${currentLang==='hr'?'Uredi budžet za':'Edit budget for'} ${safeName}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div>`;
}

function budgetCategoryMatchesStatus(cat,status) {
  const pct=budgetCategoryPercent(cat);
  return status==='all'||(status==='available'&&pct<80)||(status==='warning'&&pct>=80&&pct<100)||(status==='exceeded'&&pct>=100);
}

function renderBudgetCategoryManager() {
  const query=$('#budgetCategorySearch').value.trim().toLocaleLowerCase(locale()),status=$('#budgetCategoryStatusFilter').value;
  const filtered=state.categories.filter(cat=>categoryName(cat.id).toLocaleLowerCase(locale()).includes(query)&&budgetCategoryMatchesStatus(cat,status));
  $('#budgetCategoryResultCount').textContent=t('budgetCategoryCount',{visible:filtered.length,total:state.categories.length});
  $('#budgetCategoryModalList').innerHTML=filtered.map(cat=>budgetCategoryRow(cat,true)).join('');
  $('#budgetCategoryManagerEmpty').hidden=filtered.length>0;
}

function openBudgetCategoryManager({reset=false}={}) {
  if(reset){$('#budgetCategorySearch').value='';$('#budgetCategoryStatusFilter').value='all';}
  renderBudgetCategoryManager();
  openModal($('#budgetCategoriesModal'));
  setTimeout(()=>$('#budgetCategorySearch').focus(),50);
}

function savingsFinishDate() {
  const remaining = Math.max(0, state.savingsGoal - state.savingsBalance);
  const months = state.savingsTarget > 0 ? Math.ceil(remaining / state.savingsTarget) : 0;
  const finish = new Date(`${appReferenceDate.slice(0,7)}-01T12:00:00`);
  finish.setMonth(finish.getMonth()+months);
  return new Intl.DateTimeFormat(locale(), { month:'long', year:'numeric' }).format(finish);
}

function savingsHistorySeries(values) {
  const history=(Array.isArray(values)?values:[]).map(value=>Math.max(0,Number(value)||0));
  const safeHistory=history.length?history:[0];
  const domain=MerCore.chartDomain(safeHistory,{padding:.08});
  const baseline=184,plotHeight=160,left=36,right=964;
  return safeHistory.map((amount,index)=>({
    amount,
    x:safeHistory.length===1?500:left+(right-left)*(index/(safeHistory.length-1)),
    y:baseline-MerCore.scaleChartValue(amount,domain,plotHeight,amount>0?5:0)
  }));
}

function smoothSavingsPath(points) {
  if(!points.length)return '';
  if(points.length===1)return `M ${points[0].x} ${points[0].y}`;
  return points.slice(1).reduce((path,point,index)=>{const previous=points[index],mid=(previous.x+point.x)/2;return `${path} C ${mid} ${previous.y}, ${mid} ${point.y}, ${point.x} ${point.y}`;},`M ${points[0].x} ${points[0].y}`);
}

function renderSavingsHistoryChart() {
  const history=(state.savingsHistory||[]).map(value=>Math.max(0,Number(value)||0));
  const values=history.length?history:[0],points=savingsHistorySeries(values),linePath=smoothSavingsPath(points),baseline=184;
  const endMonth=new Date(`${appReferenceDate.slice(0,7)}-01T12:00:00Z`);
  const series=points.map((point,index)=>{const date=new Date(endMonth);date.setUTCMonth(date.getUTCMonth()-(points.length-1-index));return {...point,label:new Intl.DateTimeFormat(locale(),{month:'short',timeZone:'UTC'}).format(date)};});
  const areaPath=`${linePath} L ${points.at(-1).x} ${baseline} L ${points[0].x} ${baseline} Z`;
  $('#savingsHistorySvg').innerHTML=`<defs><linearGradient id="savingsAreaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--blue)" stop-opacity=".28"></stop><stop offset="72%" stop-color="var(--green)" stop-opacity=".08"></stop><stop offset="100%" stop-color="var(--green)" stop-opacity="0"></stop></linearGradient></defs><g class="savings-chart-grid" aria-hidden="true"><line x1="28" y1="24" x2="972" y2="24"></line><line x1="28" y1="77" x2="972" y2="77"></line><line x1="28" y1="130" x2="972" y2="130"></line><line x1="28" y1="184" x2="972" y2="184"></line></g><path class="savings-area-fill" d="${areaPath}"></path><path class="savings-area-line" d="${linePath}"></path>`;
  $('#savingsChartPoints').innerHTML=series.map((point,index)=>{const x=point.x/10,y=point.y/2.2,label=t('savingsPointLabel',{month:point.label,amount:currency(point.amount)});return `<button type="button" class="savings-chart-point ${index===series.length-1?'current':''}" style="--point-x:${x}%;--point-y:${y}%" data-savings-chart-point="${index}" aria-label="${escapeHtml(label)}"><span aria-hidden="true"></span></button>`;}).join('');
  $('#savingsChartAxis').style.setProperty('--chart-columns',String(series.length));
  $('#savingsChartAxis').innerHTML=series.map((point,index)=>`<span class="${series.length>8&&index%2===1&&index!==series.length-1?'axis-label-optional':''}">${escapeHtml(point.label)}</span>`).join('');
  const tooltip=$('#savingsChartTooltip'),hideTooltip=()=>{tooltip.hidden=true;};
  $$('[data-savings-chart-point]').forEach(button=>{const point=series[Number(button.dataset.savingsChartPoint)],showTooltip=()=>{tooltip.textContent=t('savingsPointLabel',{month:point.label,amount:currency(point.amount)});tooltip.style.setProperty('--tooltip-x',`${point.x/10}%`);tooltip.style.setProperty('--tooltip-y',`${point.y/2.2}%`);tooltip.hidden=false;};button.addEventListener('mouseenter',showTooltip);button.addEventListener('focus',showTooltip);button.addEventListener('click',showTooltip);button.addEventListener('mouseleave',hideTooltip);button.addEventListener('blur',hideTooltip);});
  $('#contributionChart').onmouseleave=hideTooltip;
  $('#contributionChart').setAttribute('aria-label',`${t('monthlySavingsChart')}: ${series.map(point=>t('savingsPointLabel',{month:point.label,amount:currency(point.amount,true)})).join(', ')}. ${t('totalSavedPeriod')}: ${currency(values.reduce((sum,value)=>sum+value,0))}`);
  return series;
}

function renderSavingsView() {
  const pct = Math.round(MerCore.ratioPercent(state.savingsBalance,state.savingsGoal,100));
  $('#savingsHeroCurrent').textContent = currency(state.savingsBalance, true);
  $('#savingsHeroTarget').textContent = t('goalTargetOf',{target:currency(state.savingsGoal,true)});
  $('#savingsHeroProgress').style.width = `${pct}%`;
  $('#savingsHeroTrack')?.setAttribute('aria-valuenow',String(pct));
  $('#savingsHeroTrack')?.setAttribute('aria-valuetext',`${pct}% · ${currency(state.savingsBalance,true)} ${t('goalTargetOf',{target:currency(state.savingsGoal,true)})}`);
  $('#stillNeeded').textContent = currency(Math.max(0,state.savingsGoal-state.savingsBalance),true);
  $('#savingsMonthly').textContent = currency(state.savingsTarget,true);
  $('#savingsFinish').textContent = savingsFinishDate();
  const coverage=state.savingsBalance/Math.max(1,state.bills),plan=getPlan();
  $('#coverageMonths').textContent = t('months',{value:number(coverage,1)});
  $('#strategyCoverageValue').textContent=t('months',{value:number(coverage,1)});
  $('#strategyBufferValue').textContent=currency(plan.buffer,true);
  $('#strategyContributionValue').textContent=currency(state.savingsTarget,true);
  $('#strategyRecommendationValue').textContent=t(coverage<3?'strategyBuildReserve':coverage<=6?'strategyMaintainPace':'strategyDiversify');
  const history=(state.savingsHistory||[]).map(value=>Math.max(0,Number(value)||0)),sum=history.reduce((a,b)=>a+b,0);
  $('#yearSaved').textContent = currency(sum,true);
  $('#chartTotalSaved').textContent=currency(sum);
  $('#savingsMonthlyAverage').textContent=currency(history.length?sum/history.length:0,true);
  const series=renderSavingsHistoryChart(),best=series.reduce((winner,point)=>point.amount>winner.amount?point:winner,series[0]);
  $('#savingsBestMonth').textContent=`${best.label} · ${currency(best.amount,true)}`;
  const current=history.at(-1)||0,previous=history.at(-2)||0,delta=previous>0?(current-previous)/previous*100:current>0?100:0,rounded=Math.round(Math.abs(delta));
  const trendBadge=$('#savingsTrendBadge');trendBadge.textContent=`${delta>0?'+':delta<0?'−':''}${rounded}%`;trendBadge.className=`savings-trend-pill ${delta>0?'positive':delta<0?'negative':'neutral'}`;trendBadge.title=delta>0?t('savingsTrendUp'):delta<0?t('savingsTrendDown'):t('savingsTrendFlat');trendBadge.setAttribute('aria-label',`${trendBadge.textContent} · ${trendBadge.title}`);
}

function renderSavingsEntries() {
  state.savingsEntries=state.savingsEntries||[];
  $('#savingsEntryList').innerHTML=state.savingsEntries.length?state.savingsEntries.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(entry=>{const goal=state.goalBuckets?.find(item=>item.id===entry.goalId);return `<article class="savings-entry-item"><span class="savings-entry-icon"><svg aria-hidden="true"><use href="#icon-leaf"></use></svg></span><div class="savings-entry-copy"><strong>${escapeHtml(entry.note)}</strong><small><time datetime="${escapeHtml(String(entry.date).slice(0,10))}">${new Intl.DateTimeFormat(locale(),{day:'numeric',month:'long',year:'numeric'}).format(new Date(entry.date))}</time> · ${escapeHtml(goal?.name||t('unknownSavingsGoal'))}</small><span class="savings-entry-profile">${escapeHtml(t(state.accountLabel))}</span></div><span class="savings-entry-amount">+${currency(entry.amount)}</span><button type="button" class="icon-button small" data-edit-savings="${entry.id}" aria-label="${t('editSavingsEntry')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></article>`;}).join(''):`<div class="notification-empty">${t('emptyActivity')}</div>`;
  $$('[data-edit-savings]').forEach(button=>button.addEventListener('click',()=>openSavingsDeposit(button.dataset.editSavings)));
}

function renderUpcoming() {
  const items = [
    {name:'Netflix',due:t('dueTomorrow'),category:t('entertainment'),amount:15.49,style:'blue',icon:'N'},
    {name:currentLang==='hr'?'Električna energija':'Electricity',due:t('dueDate',{day:22}),category:t('utilities'),amount:64.20,style:'gold',icon:'<svg aria-hidden="true"><use href="#icon-bolt"></use></svg>'},
    {name:currentLang==='hr'?'Mobilna tarifa':'Mobile plan',due:t('dueDate',{day:25}),category:t('utilities'),amount:24,style:'pink',icon:'<svg aria-hidden="true"><use href="#icon-phone"></use></svg>'}
  ];
  $('#upcomingList').innerHTML = items.map(item => `<div class="upcoming-item"><span class="merchant-icon ${item.style}">${item.icon}</span><div><strong>${item.name}</strong><span>${item.due} · ${item.category}</span></div><strong>−${currency(item.amount)}</strong></div>`).join('');
}

function bankConnectionsFor(profileId=appState.activeAccount) { return appState.bankConnections.filter(connection=>connection.profileId===profileId); }
function uncategorizedTransactions(profile=state) { return (profile.transactions||[]).filter(transaction=>transaction.sourceType==='auto'&&transaction.needsReview); }
function notificationFingerprint(parts) { return MerCore.stableTransactionHash(Array.isArray(parts)?parts:[parts]); }
function uncategorizedNotificationFingerprint() { const ids=uncategorizedTransactions().map(transaction=>String(transaction.id)).sort();return ids.length?notificationFingerprint(ids):''; }
function isNotificationResolved(item) { return Boolean(item?.key&&item?.fingerprint&&state.dismissedNotifications?.[item.key]===item.fingerprint); }
function resolveNotification(item,{closeCenter=false}={}) { if(!item?.key||!item?.fingerprint)return;state.dismissedNotifications={...(state.dismissedNotifications||{}),[item.key]:item.fingerprint};save('notification-resolve');if(closeCenter)closeNotifications();showToast(t('notificationResolved')); }

function lastSyncedLabel(connection) {
  if(!connection?.lastSyncedAt)return t('neverSynced');
  const minutes=Math.max(0,Math.floor((Date.now()-new Date(connection.lastSyncedAt).getTime())/60000));
  if(minutes<1)return t('lastSyncedNow');
  if(minutes<60)return t('lastSyncedMinutes',{count:minutes});
  return t('lastSyncedHours',{count:Math.floor(minutes/60)});
}

function connectionStatusLabel(connection) {
  if(connection.status!=='error')return {text:lastSyncedLabel(connection),className:''};
  if(connection.lastErrorCode==='TOKEN_EXPIRED')return {text:t('tokenExpired'),className:'error'};
  if(connection.lastErrorCode==='DISCONNECTED')return {text:t('connectionLost'),className:'error'};
  if(connection.lastErrorCode==='RATE_LIMITED')return {text:t('rateLimited',{count:connection.retryAfterSeconds||5}),className:'warning'};
  return {text:t('syncFailed'),className:'error'};
}

function renderBankSyncStatus() {
  const connections=bankConnectionsFor();
  const reviewCount=uncategorizedTransactions().length;
  const reviewItem={key:'uncategorized',fingerprint:uncategorizedNotificationFingerprint()};
  $('#connectedBankCount').textContent=connections.length;
  $('#uncategorizedCount').textContent=reviewCount;
  $('#uncategorizedCountLabel').textContent=t('needsReviewCount',{count:reviewCount});
  $('#uncategorizedBadge').hidden=reviewCount===0||isNotificationResolved(reviewItem);
  $('#resolveUncategorized').dataset.notificationKey=reviewItem.key;
  $('#resolveUncategorized').dataset.notificationFingerprint=reviewItem.fingerprint;
  const status=$('#bankSyncStatus'),button=$('#syncNow'),trigger=$('#headerBankButton'),dot=$('#headerBankDot'),label=$('#headerBankLabel');
  const connected=connections.length>0;
  button.hidden=!connected;
  button.disabled=bankSyncInProgress;
  $('span',button).textContent=t(bankSyncInProgress?'syncing':'syncNow');
  dot.hidden=!connected;
  trigger.classList.toggle('connected',connected);
  trigger.dataset.connected=String(connected);
  trigger.setAttribute('aria-label',connected?t('connectedCount',{count:connections.length}):t('connectBank'));
  label.textContent=connected?t('connectedCount',{count:connections.length}):t('connectBank');
  if(!connected){
    status.textContent=t('noConnectedAccounts');
    return;
  }
  const latest=connections.filter(item=>item.lastSyncedAt).sort((a,b)=>new Date(b.lastSyncedAt)-new Date(a.lastSyncedAt))[0];
  const error=connections.find(item=>item.status==='error');
  status.textContent=error?connectionStatusLabel(error).text:`${lastSyncedLabel(latest)} · ${t('backgroundSync')}`;
}

function renderProviderPicker() {
  const providers=MerBankProviders.getProviders();
  $('#providerGrid').innerHTML=providers.map(provider=>`<button type="button" class="provider-option ${selectedBankProviderId===provider.id?'active':''}" data-provider-id="${provider.id}" aria-pressed="${selectedBankProviderId===provider.id}"><span class="institution-mark" style="background:${provider.color}">${escapeHtml(provider.name.slice(0,3))}</span><span><strong>${escapeHtml(provider.name)}</strong><small>${escapeHtml(provider.region)}</small></span></button>`).join('');
  $$('[data-provider-id]').forEach(button=>button.addEventListener('click',()=>selectBankProvider(button.dataset.providerId)));
}

function selectBankProvider(providerId) {
  selectedBankProviderId=providerId;
  renderProviderPicker();
  renderProviderAccounts();
  const provider=MerBankProviders.getProvider(providerId);
  if(provider&&!$('#bankConnectionAlias').value.trim())$('#bankConnectionAlias').value=provider.name;
  setBankConnectionStep('accounts',{focus:true});
}

function renderProviderAccounts() {
  const provider=MerBankProviders.getProvider(selectedBankProviderId);if(!provider)return;
  const alreadyConnected=new Set(appState.bankConnections.filter(connection=>connection.providerId===provider.id).map(connection=>connection.accountId));
  $('#providerAccountList').innerHTML=provider.accounts.map(account=>`<label class="bank-account-choice"><input type="checkbox" name="bankAccount" value="${account.id}" ${alreadyConnected.has(account.id)?'disabled':''}><span><strong>${escapeHtml(account.name)} ${escapeHtml(account.mask)}</strong><small>${escapeHtml(currentLang==='hr'?account.kind:account.kindEn)}${alreadyConnected.has(account.id)?` · ${t('connectedAccount')}`:''}</small></span></label>`).join('');
  setBankAccountSelectionError(false);
}

function setBankAccountSelectionError(visible) {
  const picker=$('#bankAccountPicker'),error=$('#bankAccountSelectionError');
  if(!picker||!error)return;
  picker.classList.toggle('has-error',visible);
  error.hidden=!visible;
  $$('input[name="bankAccount"]',picker).forEach(input=>{
    if(visible){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','bankAccountSelectionError');}
    else{input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');}
  });
}

function setBankConnectionStep(step,{focus=false}={}) {
  const next=['overview','institution','accounts'].includes(step)?step:'overview';
  if(next!=='accounts')setBankAccountSelectionError(false);
  bankConnectionStep=next;
  const modal=$('#connectedBanksModal'),overview=$('#bankConnectionsView'),form=$('#bankConnectForm');
  const connecting=next!=='overview';
  modal.classList.toggle('is-connecting',connecting);
  overview.hidden=connecting;
  form.hidden=!connecting;
  $('#bankInstitutionStep').hidden=next!=='institution';
  $('#bankAccountStep').hidden=next!=='accounts';
  $$('[data-bank-step-indicator]',form).forEach(marker=>marker.classList.toggle('active',marker.dataset.bankStepIndicator===next));
  if(connecting){
    const titleKey=next==='accounts'?'chooseAccounts':'chooseInstitution';
    const labelKey=next==='accounts'?'bankStepTwo':'bankStepOne';
    $('#bankConnectionStepTitle').dataset.i18n=titleKey;
    $('#bankConnectionStepTitle').textContent=t(titleKey);
    $('#bankConnectionStepLabel').dataset.i18n=labelKey;
    $('#bankConnectionStepLabel').textContent=t(labelKey);
  }
  if(!focus)return;
  requestAnimationFrame(()=>{
    const target=next==='overview'?$('#startBankConnection'):next==='accounts'?$('input[name="bankAccount"]:not([disabled])',$('#bankAccountStep')):$('.provider-option',$('#bankInstitutionStep'));
    target?.focus({preventScroll:true});
  });
}

function resetBankConnectionFlow({focus=false}={}) {
  selectedBankProviderId=null;
  $('#bankConnectForm').reset();
  $('#providerAccountList').replaceChildren();
  setBankAccountSelectionError(false);
  $('#bankConnectionAlias').value='';
  $('#bankApiToken').value='';
  setBankConnectionStep('overview',{focus});
}

let activeBankActionTooltipTrigger=null;
function showBankActionTooltip(trigger) {
  if(!trigger?.isConnected)return;
  const tip=$('#bankActionTooltip'),visual=window.visualViewport;
  const bounds=visual?{left:visual.offsetLeft,top:visual.offsetTop,width:visual.width,height:visual.height}:{left:0,top:0,width:window.innerWidth,height:window.innerHeight};
  clearTimeout(hideBankActionTooltip.timer);
  if(activeBankActionTooltipTrigger&&activeBankActionTooltipTrigger!==trigger)activeBankActionTooltipTrigger.removeAttribute('aria-describedby');
  activeBankActionTooltipTrigger=trigger;
  tip.textContent=t(trigger.dataset.bankTooltipKey);
  tip.hidden=false;
  tip.style.left='0px';tip.style.top='0px';
  const rect=trigger.getBoundingClientRect(),tipRect=tip.getBoundingClientRect(),edge=8,gap=8;
  const left=Math.max(bounds.left+edge,Math.min(bounds.left+bounds.width-tipRect.width-edge,rect.left+rect.width/2-tipRect.width/2));
  const above=rect.top-tipRect.height-gap>=bounds.top+edge;
  const top=above?rect.top-tipRect.height-gap:Math.min(bounds.top+bounds.height-tipRect.height-edge,rect.bottom+gap);
  tip.style.left=`${left}px`;tip.style.top=`${Math.max(bounds.top+edge,top)}px`;
  trigger.setAttribute('aria-describedby','bankActionTooltip');
}

function hideBankActionTooltip(delay=0) {
  clearTimeout(hideBankActionTooltip.timer);
  const hide=()=>{const tip=$('#bankActionTooltip');if(tip)tip.hidden=true;activeBankActionTooltipTrigger?.removeAttribute('aria-describedby');activeBankActionTooltipTrigger=null;};
  if(delay)hideBankActionTooltip.timer=setTimeout(hide,delay);else hide();
}

function bindBankActionTooltips() {
  $$('[data-bank-action-tooltip]',$('#bankConnectionList')).forEach(trigger=>{
    let pressTimer=null,longPressReleaseTimer=null,longPressed=false,startX=0,startY=0;
    const cancelPending=()=>{clearTimeout(pressTimer);pressTimer=null;};
    const releaseLongPress=()=>{clearTimeout(longPressReleaseTimer);hideBankActionTooltip(1600);longPressReleaseTimer=setTimeout(()=>{longPressed=false;},1600);};
    trigger.addEventListener('mouseenter',()=>showBankActionTooltip(trigger));
    trigger.addEventListener('mouseleave',event=>{if(event.pointerType!=='touch')hideBankActionTooltip();});
    trigger.addEventListener('focus',()=>showBankActionTooltip(trigger));
    trigger.addEventListener('blur',()=>hideBankActionTooltip());
    trigger.addEventListener('pointerdown',event=>{
      if(!['touch','pen'].includes(event.pointerType))return;
      startX=event.clientX;startY=event.clientY;longPressed=false;cancelPending();
      pressTimer=setTimeout(()=>{longPressed=true;showBankActionTooltip(trigger);},450);
    });
    trigger.addEventListener('pointermove',event=>{if(Math.hypot(event.clientX-startX,event.clientY-startY)>10){cancelPending();if(longPressed)hideBankActionTooltip();}});
    trigger.addEventListener('pointercancel',()=>{cancelPending();longPressed=false;hideBankActionTooltip();});
    trigger.addEventListener('pointerup',()=>{cancelPending();if(longPressed)releaseLongPress();});
    trigger.addEventListener('contextmenu',event=>{event.preventDefault();longPressed=true;showBankActionTooltip(trigger);releaseLongPress();});
    trigger.addEventListener('click',event=>{if(!longPressed)return;event.preventDefault();event.stopImmediatePropagation();clearTimeout(longPressReleaseTimer);longPressed=false;hideBankActionTooltip();},true);
  });
}

function renderBankSettings() {
  hideBankActionTooltip();
  const connections=appState.bankConnections;
  $('#settingsConnectionSummary').textContent=t('connectionsSummary',{count:connections.length,profile:t(state.accountLabel)});
  $('#bankEmptyState').hidden=connections.length>0;
  $('#bankConnectionList').innerHTML=connections.map(connection=>{const provider=MerBankProviders.getProvider(connection.providerId);const status=connectionStatusLabel(connection);const displayName=connection.connectionAlias||connection.accountName;return `<article class="bank-connection-card"><span class="institution-mark" style="background:${provider?.color||'#16574b'}">${escapeHtml(connection.institution.slice(0,3))}</span><div class="connection-copy"><strong>${escapeHtml(displayName)} ${escapeHtml(connection.accountMask)}</strong><span>${escapeHtml(currentLang==='hr'?connection.accountKind:connection.accountKindEn)}</span><small class="connection-status ${status.className}">${escapeHtml(status.text)}</small></div><label class="connection-mapping"><span>${t('assignProfile')}</span><select data-map-bank="${connection.id}" aria-label="${t('assignProfile')}"><option value="personal" ${connection.profileId==='personal'?'selected':''}>${t('personalAccount')}</option><option value="business" ${connection.profileId==='business'?'selected':''}>${t('businessAccount')}</option></select></label><div class="connection-actions"><button type="button" class="icon-button bank-action-button" data-bank-action-tooltip data-bank-tooltip-key="manualBankSyncTooltip" data-refresh-bank="${connection.id}" title="${t('manualBankSyncTooltip')}" aria-label="${t('manualBankSyncTooltip')}"><svg aria-hidden="true"><use href="#icon-refresh"></use></svg></button><button type="button" class="icon-button danger-icon bank-action-button" data-bank-action-tooltip data-bank-tooltip-key="unlinkBankTooltip" data-unlink-bank="${connection.id}" title="${t('unlinkBankTooltip')}" aria-label="${t('unlinkBankTooltip')}"><svg aria-hidden="true"><use href="#icon-unlink"></use></svg></button></div></article>`;}).join('');
  $$('[data-map-bank]').forEach(select=>select.addEventListener('change',()=>runAsyncAction(()=>mapBankConnection(select.dataset.mapBank,select.value))));
  $$('[data-refresh-bank]').forEach(button=>button.addEventListener('click',()=>runAsyncAction(()=>refreshBankConnection(button.dataset.refreshBank))));
  $$('[data-unlink-bank]').forEach(button=>button.addEventListener('click',()=>requestUnlinkBank(button)));
  bindBankActionTooltips();
  if(bankConnectionStep==='institution')renderProviderPicker();
}

function openBankSettings() {
  resetBankConnectionFlow();
  toggleAccountMenu(false);
  renderBankSettings();
  openModal($('#connectedBanksModal'));
}

function startBankConnection() {
  selectedBankProviderId=null;
  $('#bankProfileSelect').value=appState.activeAccount;
  $('#bankConnectionAlias').value='';
  $('#bankApiToken').value='';
  renderProviderPicker();
  setBankConnectionStep('institution',{focus:true});
}

async function syncBankConnection(connection,{silent=false}={}) {
  const profile=appState.accounts[connection.profileId];if(!profile)return {imported:0,duplicates:0,uncategorized:0,error:'DISCONNECTED'};
  try{
    const response=await MerBankProviders.fetchTransactions(connection);
    const result=MerCore.importBankTransactions(profile,connection,response.transactions,appReferenceDate);
    result.imported.forEach(transaction=>MerAccounting.applyRoundUp(profile,transaction,appReferenceDate));
    connection.cursor=response.nextCursor;connection.lastSyncedAt=response.fetchedAt;connection.status='connected';connection.lastErrorCode=null;connection.retryAfterSeconds=null;
    return {imported:result.imported.length,duplicates:result.duplicates,uncategorized:result.uncategorized,error:null};
  }catch(error){
    connection.status='error';connection.lastErrorCode=error.code||'SYNC_FAILED';connection.retryAfterSeconds=error.retryAfterSeconds||null;
    if(!silent)showToast(connectionStatusLabel(connection).text);
    return {imported:0,duplicates:0,uncategorized:0,error:connection.lastErrorCode};
  }
}

async function syncActiveBankConnections({silent=false}={}) {
  const connections=bankConnectionsFor();
  if(!connections.length){if(!silent)openBankSettings();return {skipped:'no-connections'};}
  if(bankSyncInProgress)return;
  bankSyncInProgress=true;renderBankSyncStatus();
  const results=[];for(const connection of connections)results.push(await syncBankConnection(connection,{silent}));
  bankSyncInProgress=false;save('bank-sync');
  if(!silent){const imported=results.reduce((sum,result)=>sum+result.imported,0),duplicates=results.reduce((sum,result)=>sum+result.duplicates,0);if(!results.some(result=>result.error))showToast(imported?t('syncComplete',{imported,duplicates}):t('noNewTransactions'));}
}

async function refreshBankConnection(connectionId) {
  const connection=appState.bankConnections.find(item=>item.id===connectionId);if(!connection)return;
  MerBankProviders.renewConnection(connection);bankSyncInProgress=true;renderBankSyncStatus();const result=await syncBankConnection(connection);bankSyncInProgress=false;save('bank-refresh');renderBankSettings();if(!result.error)showToast(result.imported?t('syncComplete',{imported:result.imported,duplicates:result.duplicates}):t('noNewTransactions'));
}

async function mapBankConnection(connectionId,profileId) {
  const connection=appState.bankConnections.find(item=>item.id===connectionId);if(!connection||connection.profileId===profileId)return;
  const previousProfile=appState.accounts[connection.profileId];
  const moved=(previousProfile.transactions||[]).filter(transaction=>transaction.connectionId===connection.id);
  moved.forEach(transaction=>MerAccounting.undoRoundUp(previousProfile,transaction));
  previousProfile.transactions=previousProfile.transactions.filter(transaction=>transaction.connectionId!==connection.id);
  connection.profileId=profileId==='business'?'business':'personal';connection.cursor=0;connection.lastAttemptAt=null;connection.lastSyncedAt=null;connection.status='connected';connection.lastErrorCode=null;
  await syncBankConnection(connection,{silent:true});save('bank-profile-map');renderBankSettings();showToast(t('mappingUpdated',{profile:t(appState.accounts[connection.profileId].accountLabel)}));
}

function requestUnlinkBank(button) {
  const connection=appState.bankConnections.find(item=>item.id===button?.dataset.unlinkBank);if(!connection)return;
  pendingBankUnlinkId=connection.id;
  hideBankActionTooltip();
  const modal=$('#unlinkBankModal');
  modalReturnFocus.set(modal,button);
  if(!modal.open){modal.showModal();document.body.classList.add('modal-active');}
  requestAnimationFrame(()=>$('#confirmBankUnlink')?.focus({preventScroll:true}));
}

function confirmBankUnlink() {
  const connectionId=pendingBankUnlinkId;if(!connectionId)return;
  const before=appState.bankConnections.length;
  appState.bankConnections=appState.bankConnections.filter(connection=>connection.id!==connectionId);
  pendingBankUnlinkId=null;
  if(appState.bankConnections.length===before){closeModal($('#unlinkBankModal'));return;}
  save('bank-unlink');
  renderBankSettings();
  modalReturnFocus.set($('#unlinkBankModal'),$('#startBankConnection'));
  closeModal($('#unlinkBankModal'));
  showToast(t('connectionUnlinked'));
}

async function connectSelectedBankAccounts() {
  if(!selectedBankProviderId){setBankConnectionStep('institution',{focus:true});showToast(t('selectInstitution'));return;}
  const selected=$$('input[name="bankAccount"]:checked',$('#bankConnectForm')).map(input=>input.value);if(!selected.length){setBankAccountSelectionError(true);$('input[name="bankAccount"]:not([disabled])',$('#bankAccountStep'))?.focus({preventScroll:true});return;}
  setBankAccountSelectionError(false);
  const profileId=$('#bankProfileSelect').value==='business'?'business':'personal',alias=$('#bankConnectionAlias').value.trim();
  const connections=selected.map((accountId,index)=>{const connection=MerBankProviders.createConnection(selectedBankProviderId,accountId,profileId,Date.now()+index);if(alias)connection.connectionAlias=selected.length>1?`${alias} ${index+1}`:alias;return connection;});
  $('#bankApiToken').value='';
  appState.bankConnections.push(...connections);
  bankSyncInProgress=true;const results=[];for(const connection of connections)results.push(await syncBankConnection(connection,{silent:true}));bankSyncInProgress=false;resetBankConnectionFlow();save('bank-connect');renderBankSettings();showToast(t('accountsConnected',{count:connections.length,imported:results.reduce((sum,result)=>sum+result.imported,0)}));
}

function formatIsoDate(value) { if(!validStoredDate(value))return '—';return new Intl.DateTimeFormat(locale(),{day:'numeric',month:'short',year:'numeric',timeZone:appState.settings.timezone||'Europe/Zagreb'}).format(new Date(`${String(value).slice(0,10)}T12:00:00Z`)); }

function renderRecurring() {
  state.recurring=state.recurring||[];
  $('#recurringList').innerHTML=state.recurring.length?state.recurring.map(rule=>{const next=MerCore.nextOccurrence(rule,appReferenceDate);return `<div class="recurring-item"><span class="recurring-date-icon"><svg aria-hidden="true"><use href="#icon-calendar"></use></svg></span><div class="recurring-copy"><strong>${escapeHtml(rule.name)}</strong><small>${t('monthlyOnDay',{day:rule.day})} · ${t('nextCharge',{date:formatIsoDate(next)})}</small></div><span class="recurring-amount">−${currency(rule.amount)}</span><button type="button" class="icon-button small" data-edit-recurring="${rule.id}" aria-label="${t('editExpense')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div>`;}).join(''):`<div class="notification-empty">${t('noRecurring')}</div>`;
  $$('[data-edit-recurring]').forEach(button=>button.addEventListener('click',()=>openRecurring(button.dataset.editRecurring)));
}

function buildNotifications() {
  const notifications=[],seen=new Set(),push=item=>{if(seen.has(item.key)||isNotificationResolved(item))return;seen.add(item.key);notifications.push(item);};
  const reviewCount=uncategorizedTransactions().length;if(reviewCount)push({key:'uncategorized',fingerprint:uncategorizedNotificationFingerprint(),priority:5,type:'warning',icon:'icon-alert',title:t('alertUncategorizedTitle'),body:t('alertUncategorizedBody',{count:reviewCount}),action:t('reviewCategories'),view:'activity',reviewOnly:true});
  const plan=getPlan();if(plan.monthlyBudget&&plan.safeRemaining/plan.monthlyBudget<.25)push({key:'safe-to-spend',fingerprint:notificationFingerprint([Math.round(plan.safeRemaining*100),Math.round(plan.monthlyBudget*100)]),priority:5,type:'warning',icon:'icon-shield',title:t('alertSpendingTitle'),body:t('alertSpendingBody',{amount:currency(plan.safeRemaining)}),action:t('reviewSpending'),view:'activity'});
  state.categories.forEach(cat=>{const threshold=MerCore.budgetThreshold(cat.spent,cat.limit);if(threshold.percent>=80)push({key:`budget:${cat.id}`,fingerprint:notificationFingerprint([cat.id,Math.round(cat.spent*100),Math.round(cat.limit*100)]),priority:threshold.level==='red'?4:3,type:threshold.level==='red'?'danger':'warning',icon:'icon-wallet',title:t('alertBudgetTitle'),body:t('alertBudgetBody',{category:categoryName(cat.id),percent:Math.round(threshold.percent)}),action:t('reviewBudget'),view:'budgets'});});
  (state.recurring||[]).forEach(rule=>{const next=MerCore.nextOccurrence(rule,appReferenceDate);if(next){const days=Math.round((new Date(`${next}T12:00:00`)-new Date(`${appReferenceDate}T12:00:00`))/86400000);if(days<=20)push({key:`recurring:${rule.id}`,fingerprint:notificationFingerprint([rule.id,next,Math.round(rule.amount*100)]),priority:2,type:'info',icon:'icon-calendar',title:t('alertRecurringTitle'),body:t('alertRecurringBody',{name:rule.name,amount:currency(rule.amount),date:formatIsoDate(next)}),action:t('reviewRecurring'),view:'budgets',detailModal:'budgetDetailsModal'});}});
  MerAccounting.detectSubscriptions(state.transactions,appReferenceDate).filter(subscription=>subscription.daysUntil>=0&&subscription.daysUntil<=31).slice(0,2).forEach(subscription=>push({key:subscription.id,fingerprint:notificationFingerprint([subscription.id,subscription.nextRenewal,Math.round(subscription.amount*100)]),priority:2,type:'info',icon:'icon-refresh',title:t('recurringSubscriptions'),body:`${subscription.merchant} · ${currency(subscription.amount)} · ${t('renewsIn',{days:subscription.daysUntil})}`,action:t('manageSubscriptions'),view:'insights',subscriptions:true}));
  return notifications.sort((left,right)=>right.priority-left.priority||left.key.localeCompare(right.key)).slice(0,6);
}

function renderNotifications() {
  const notifications=buildNotifications();
  $('#notificationCount').textContent=notifications.length;
  $('#notificationCount').hidden=notifications.length===0;
  $('#notificationButton').setAttribute('aria-label',t('notificationCount',{count:notifications.length}));
  $('#notificationList').innerHTML=notifications.length?notifications.map((item,index)=>`<article class="notification-item"><span class="notification-symbol ${item.type}"><svg aria-hidden="true"><use href="#${item.icon}"></use></svg></span><div class="notification-copy"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><div class="notification-actions"><button type="button" class="link-button" data-notification-view="${item.view}" data-notification-review="${item.reviewOnly?'true':'false'}" data-notification-index="${index}">${escapeHtml(item.action)}<span aria-hidden="true">→</span></button><button type="button" class="link-button resolve-alert-button" data-notification-resolve="${index}" aria-label="${escapeHtml(t('resolveNotificationLabel',{title:item.title}))}">${t('markResolved')}</button></div></div></article>`).join(''):`<div class="notification-empty">${t('noNotifications')}</div>`;
  $$('[data-notification-view]').forEach(button=>button.addEventListener('click',()=>{const item=notifications[Number(button.dataset.notificationIndex)];activityReviewOnly=button.dataset.notificationReview==='true';showView(button.dataset.notificationView);renderActivity();closeNotifications();if(item?.subscriptions)openModal($('#subscriptionsModal'));else if(item?.detailModal)openModal($(`#${item.detailModal}`));}));
  $$('[data-notification-resolve]').forEach(button=>button.addEventListener('click',()=>resolveNotification(notifications[Number(button.dataset.notificationResolve)],{closeCenter:false})));
}

function renderSubscriptions() {
  const subscriptions=MerAccounting.detectSubscriptions(state.transactions,appReferenceDate);
  $('#subscriptionCount').textContent=String(subscriptions.length);$('#subscriptionTotal').textContent=currency(subscriptions.reduce((sum,item)=>sum+item.amount,0),true);
  $('#subscriptionList').innerHTML=subscriptions.length?subscriptions.map(item=>`<article class="subscription-item"><span class="subscription-logo">${escapeHtml(item.merchant.slice(0,1).toUpperCase())}</span><div><strong>${escapeHtml(item.merchant)}</strong><small>${escapeHtml(categoryName(item.category))} · ${t('renewsIn',{days:Math.max(0,item.daysUntil)})}</small></div><span><strong>−${currency(item.amount)}</strong><small>${formatIsoDate(item.nextRenewal)}</small></span></article>`).join(''):`<div class="notification-empty">${t('noSubscriptions')}</div>`;
}

function renderCategorySelects() {
  const transactionValue = $('#transactionCategory').value;
  const transactionCategories=transactionType==='income'?state.incomeCategories:state.categories;
  $('#transactionCategory').innerHTML = transactionCategories.map(cat => `<option value="${cat.id}">${escapeHtml(transactionType==='income'?incomeCategoryName(cat.id):categoryName(cat.id))}</option>`).join('');
  if (transactionCategories.some(cat=>cat.id===transactionValue)) $('#transactionCategory').value = transactionValue;
  const filterValue = $('#activityFilter').value || 'all';
  $('#activityFilter').innerHTML = `<option value="all">${t('allCategories')}</option><optgroup label="${t('expensesOnly')}">${state.categories.map(cat=>`<option value="${cat.id}">${escapeHtml(categoryName(cat.id))}</option>`).join('')}</optgroup><optgroup label="${t('incomeOnly')}">${state.incomeCategories.map(cat=>`<option value="income:${cat.id}">${escapeHtml(incomeCategoryName(cat.id))}</option>`).join('')}</optgroup>`;
  if (filterValue==='all' || state.categories.some(cat=>cat.id===filterValue) || state.incomeCategories.some(cat=>`income:${cat.id}`===filterValue)) $('#activityFilter').value = filterValue;
  const recurringValue=$('#recurringCategoryInput').value;
  $('#recurringCategoryInput').innerHTML=state.categories.map(cat=>`<option value="${cat.id}">${escapeHtml(categoryName(cat.id))}</option>`).join('');
  if(state.categories.some(cat=>cat.id===recurringValue))$('#recurringCategoryInput').value=recurringValue;
}

function formatTransactionDate(iso) {
  const date = new Date(iso);
  const dateKey=String(iso).slice(0,10);
  const today=appReferenceDate,yesterdayDate=new Date(`${today}T12:00:00Z`);yesterdayDate.setUTCDate(yesterdayDate.getUTCDate()-1);const yesterday=yesterdayDate.toISOString().slice(0,10);
  const key = dateKey===today ? 'dateToday' : dateKey===yesterday ? 'dateYesterday' : null;
  return key ? t(key) : Number.isNaN(date.getTime())?'—':new Intl.DateTimeFormat(locale(),{day:'numeric',month:'long',year:'numeric',timeZone:appState.settings.timezone||'Europe/Zagreb'}).format(date);
}

function activityPageSequence(totalPages,currentPage,compact=window.matchMedia('(max-width: 520px)').matches) {
  if(compact&&totalPages>3){const start=Math.max(1,Math.min(currentPage-1,totalPages-2));return [start,start+1,start+2];}
  if(totalPages<=7)return Array.from({length:totalPages},(_,index)=>index+1);
  const pages=[1,totalPages,currentPage-1,currentPage,currentPage+1].filter(page=>page>=1&&page<=totalPages).filter((page,index,all)=>all.indexOf(page)===index).sort((a,b)=>a-b);
  return pages.reduce((result,page,index)=>{if(index&&page-pages[index-1]>1)result.push(null);result.push(page);return result;},[]);
}

function renderActivityPagination(pagination) {
  activityPage=pagination.page;
  const continuous=activityViewMode==='continuous';
  const visible=continuous?pagination.totalItems:pagination.items.length;
  $('#transactionList').classList.toggle('continuous',continuous);
  $('#activityResultSummary').textContent=t('activityResultCount',{visible,total:pagination.totalItems});
  $$('[data-activity-view-mode]').forEach(button=>{const active=button.dataset.activityViewMode===activityViewMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  const navigation=$('#activityPagination');
  navigation.hidden=continuous||pagination.totalItems<=pagination.pageSize;
  $('#activityPreviousPage').disabled=pagination.page<=1;
  $('#activityNextPage').disabled=pagination.page>=pagination.totalPages;
  $('#activityPageNumbers').innerHTML=activityPageSequence(pagination.totalPages,pagination.page).map(page=>page===null?'<span class="activity-page-ellipsis" aria-hidden="true">…</span>':`<button type="button" class="activity-page-button${page===pagination.page?' active':''}" data-activity-page="${page}" ${page===pagination.page?'aria-current="page"':''} aria-label="${t('activityPageLabel',{page,pages:pagination.totalPages})}">${page}</button>`).join('');
  $$('[data-activity-page]').forEach(button=>button.addEventListener('click',()=>{activityPage=Number(button.dataset.activityPage);renderActivity();$('#transactionList').scrollTop=0;$('#activityPageNumbers [aria-current="page"]')?.focus({preventScroll:true});}));
}

function renderActivity() {
  const search = ($('#activitySearch').value || '').trim();
  const filter = $('#activityFilter').value || 'all';
  const typeFilter=$('#activityTypeFilter').value||'all';
  const sort=$('#activitySort').value||'date-desc';
  const reviewCount=uncategorizedTransactions().length;
  const reviewItem={key:'uncategorized',fingerprint:uncategorizedNotificationFingerprint()};
  if(activityReviewOnly&&(reviewCount===0||isNotificationResolved(reviewItem)))activityReviewOnly=false;
  $('#reviewQueueBanner').hidden=!activityReviewOnly||isNotificationResolved(reviewItem);
  $('#resolveReviewQueue').dataset.notificationKey=reviewItem.key;
  $('#resolveReviewQueue').dataset.notificationFingerprint=reviewItem.fingerprint;
  $('#reviewQueueCopy').textContent=t('reviewQueueCopy',{count:reviewCount});
  const filtered = MerCore.filterActivityTransactions(state,{
    query:search,
    category:filter,
    type:typeFilter,
    dateFrom:$('#activityDateFrom').value,
    dateTo:$('#activityDateTo').value,
    sort,
    reviewOnly:activityReviewOnly,
    getCategoryLabel:(tx,type)=>type==='income'?incomeCategoryName(tx.category):categoryName(tx.category)
  });
  const pagination=MerCore.paginateItems(filtered,activityPage,ACTIVITY_PAGE_SIZE);
  const visibleTransactions=activityViewMode==='continuous'?filtered:pagination.items;
  renderActivityPagination(pagination);
  $('#activityEmpty').hidden = filtered.length > 0;
  let lastDate = '';
  $('#transactionList').innerHTML = visibleTransactions.map(tx => {
    const dateLabel = formatTransactionDate(tx.date);
    const amountSort=sort.startsWith('amount-');
    const header = !amountSort&&dateLabel!==lastDate ? `<div class="transaction-date">${dateLabel}</div>` : '';
    lastDate = dateLabel;
    const type=MerCore.transactionType(tx);const txCategory=type==='income'?state.incomeCategories.find(cat=>cat.id===tx.category):state.categories.find(cat=>cat.id===tx.category);const meta=type==='income'?incomeCategoryVisual(txCategory):(txCategory?categoryVisual(txCategory):categoryMeta.other);const displayCategory=type==='income'?incomeCategoryName(tx.category):categoryName(tx.category);
    const sourceLabel=tx.source||t('manualSource');
    const isScheduled=!MerCore.isTransactionEffective(tx,appReferenceDate);
    const transactionClock=new Intl.DateTimeFormat(locale(),{hour:'2-digit',minute:'2-digit',timeZone:appState.settings.timezone||'Europe/Zagreb'}).format(new Date(tx.date));
    const activityDateLabel=amountSort?`${formatIsoDate(String(tx.date).slice(0,10))} · ${transactionClock}`:transactionClock;
    return `${header}<div class="transaction-item ${type}${isScheduled?' is-scheduled':''}"><span class="category-icon ${meta.className}">${categoryIconMarkup(meta)}</span><div class="transaction-copy"><strong>${escapeHtml(tx.name)}</strong><div class="transaction-meta"><small>${activityDateLabel}</small><span class="transaction-source ${tx.sourceType==='auto'||tx.sourceType==='import'?'auto':''}">${escapeHtml(sourceLabel)}</span>${isScheduled?`<span class="scheduled-transaction-tag">${t('scheduledTransaction')}</span>`:''}${tx.needsReview?`<span class="needs-review-tag">${t('needsReview')}</span>`:''}</div></div><span class="transaction-category">${escapeHtml(displayCategory)}</span><span class="transaction-amount ${type}">${type==='income'?'+':'−'}${currency(tx.amount)}</span><button type="button" class="icon-button small" data-edit-transaction="${tx.id}" aria-label="${t(type==='income'?'editIncome':'editExpense')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div>`;
  }).join('');
  $$('[data-edit-transaction]').forEach(button=>button.addEventListener('click',()=>openTransaction(button.dataset.editTransaction)));
}

function escapeHtml(value) { const div=document.createElement('div'); div.textContent=value; return div.innerHTML; }

function cashflowLabel(key) {
  if(insightsTimeframe==='daily')return t('daily');
  if(insightsTimeframe==='monthly')return new Intl.DateTimeFormat(locale(),{day:'numeric',month:'short'}).format(new Date(`${key}T12:00:00`));
  if(insightsTimeframe==='ytd')return new Intl.DateTimeFormat(locale(),{month:'short'}).format(new Date(`${key}-01T12:00:00`));
  return key;
}

function renderIncomeCategories() {
  $('#incomeCategoryList').innerHTML=state.incomeCategories.map(cat=>{const visual=incomeCategoryVisual(cat);const count=state.transactions.filter(tx=>MerCore.transactionType(tx)==='income'&&tx.category===cat.id).length;return `<div class="income-category-item"><span class="category-icon ${visual.className}">${categoryIconMarkup(visual)}</span><div><strong>${escapeHtml(incomeCategoryName(cat.id))}</strong><small>${count} ${t('transactionsShort')}</small></div>${cat.isCustom?`<button type="button" class="icon-button small" data-edit-income-category="${cat.id}" aria-label="${t('editIncome')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button>`:'<span class="default-category-mark">mer</span>'}</div>`;}).join('');
  $$('[data-edit-income-category]').forEach(button=>button.addEventListener('click',()=>openIncomeCategoryEditor(button.dataset.editIncomeCategory)));
}

function renderInsights() {
  const reference=appReferenceDate;
  const filtered=MerCore.filterTransactions(state.transactions,insightsTimeframe,reference);
  const totals=derivedTotals(insightsTimeframe);
  const incomeCount=filtered.filter(tx=>MerCore.transactionType(tx)==='income').length;
  const expenseCount=filtered.length-incomeCount;
  $('#netTotalValue').textContent=`${totals.net<0?'−':''}${currency(Math.abs(totals.net))}`;
  $('#netTotalValue').className=`summary-value ${totals.net<0?'negative-value':'income-value'}`;
  $('#totalIncomeValue').textContent=currency(totals.income);
  $('#totalExpenseValue').textContent=currency(totals.expenses);
  $('#incomeCount').textContent=`${incomeCount} ${t('transactionsShort')}`;
  $('#expenseCount').textContent=`${expenseCount} ${t('transactionsShort')}`;
  $('#savingsRateValue').textContent=totals.savingsRate===null?'—':`${number(totals.savingsRate,1)}%`;
  $('#savingsRateValue').className=totals.savingsRate!==null&&totals.savingsRate<0?'negative-value':'income-value';
  $('#savingsRateContext').textContent=totals.savingsRate===null?t('noIncomeRate'):t('savingsRateContext');
  const comparison=MerCore.monthOverMonthExpenses(state.transactions,reference);
  $('#momValue').textContent=comparison.percent===null?'—':`${comparison.percent>0?'+':''}${number(comparison.percent,1)}%`;
  $('#momValue').className=comparison.direction==='up'?'negative-value':comparison.direction==='down'?'income-value':'';
  $('#momContext').textContent=comparison.percent===null?t('noPreviousMonth'):`${t(comparison.direction==='up'?'moreSpent':comparison.direction==='down'?'lessSpent':'sameSpent')} · ${t('previousMonthComparison')}`;
  const top=MerCore.topExpenseCategory(state.transactions,insightsTimeframe,reference);
  $('#topCategoryValue').textContent=top?categoryName(top.category):'—';
  $('#topCategoryContext').textContent=top?t('topCategoryContext',{amount:currency(top.amount),share:number(top.share,0)}):t('noExpensesPeriod');
  $('#insightsIncomeEmpty').hidden=totals.income>0;
  $$('#insightsFilters [data-timeframe]').forEach(button=>{const active=button.dataset.timeframe===insightsTimeframe;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});

  const groups=MerCore.groupCashflow(state.transactions,insightsTimeframe,reference);const chartEmpty=groups.length===0;
  $('#cashflowEmpty').hidden=!chartEmpty;$('#cashflowChart').hidden=chartEmpty;
  if(!chartEmpty){const cashflowDomain=MerCore.chartDomain(groups.flatMap(group=>[group.income,group.expenses]));$('#cashflowChart').innerHTML=groups.map(group=>`<div class="cashflow-column" aria-label="${cashflowLabel(group.key)}: ${t('income')} ${currency(group.income)}, ${t('expense')} ${currency(group.expenses)}"><div class="cashflow-bars"><span class="income-bar" style="height:${MerCore.scaleChartValue(group.income,cashflowDomain,150,8)}px"><b>${group.income?currency(group.income,true):''}</b></span><span class="expense-bar" style="height:${MerCore.scaleChartValue(group.expenses,cashflowDomain,150,8)}px"><b>${group.expenses?currency(group.expenses,true):''}</b></span></div><small>${cashflowLabel(group.key)}</small></div>`).join('');$('#cashflowChart').setAttribute('aria-label',`${t('cashflowChart')}: ${groups.map(group=>`${cashflowLabel(group.key)}, ${t('income')} ${currency(group.income)}, ${t('expense')} ${currency(group.expenses)}`).join('; ')}`);}
  const expenses=filtered.filter(tx=>MerCore.transactionType(tx)==='expense');const byCategory=MerCore.categoryExpenseTotals(state.transactions,insightsTimeframe,reference);const breakdown=Object.entries(byCategory).filter(([,amount])=>amount>0).sort((a,b)=>b[1]-a[1]);const expenseTotal=breakdown.reduce((sum,[,amount])=>sum+amount,0);
  $('#categoryBreakdown').innerHTML=breakdown.length?breakdown.map(([id,amount])=>{const pct=MerCore.ratioPercent(amount,expenseTotal,100);return `<div class="breakdown-row"><div><strong>${escapeHtml(categoryName(id))}</strong><span>${currency(amount)}</span></div><div class="breakdown-track"><span style="width:${pct}%"></span></div><small>${number(pct,0)}%</small></div>`;}).join(''):`<div class="notification-empty">${t('noExpensesPeriod')}</div>`;
  const palette=['#16574b','#00a9e4','#a7c83f','#f2b544','#e66d65','#755bb4','#8fa39e'];
  const segments=MerCore.proportionalSegments(breakdown).map((segment,index)=>({id:segment.entry[0],amount:segment.value,start:segment.start,end:segment.end,color:palette[index%palette.length]}));
  $('#categoryDonut').style.background=segments.length?`conic-gradient(${segments.map(segment=>`${segment.color} ${segment.start}% ${segment.end}%`).join(',')})`:'var(--canvas)';
  const donutTotal=$('#donutTotal'),donutExact=currency(expenseTotal,true),donutDisplay=donutExact.length>12?compactChartCurrency(expenseTotal):donutExact;
  donutTotal.textContent=donutDisplay;donutTotal.title=donutExact;donutTotal.dataset.fit=donutDisplay.length>10?'small':donutDisplay.length>8?'medium':'regular';$('#categoryDonutLegend').innerHTML=segments.slice(0,4).map(segment=>`<span><i style="background:${segment.color}"></i><b>${escapeHtml(categoryName(segment.id))}</b><small>${number(segment.end-segment.start,0)}%</small></span>`).join('')||`<small>${t('noExpensesPeriod')}</small>`;
  $('#categoryDonut').setAttribute('aria-label',`${t('categoryDonutTitle')}: ${segments.length?segments.map(segment=>`${categoryName(segment.id)} ${number(segment.end-segment.start,0)}%`).join(', '):t('noExpensesPeriod')}. ${t('totalExpenses')}: ${currency(expenseTotal)}`);
  const gaugePercent=totals.savingsRate===null?0:Math.max(0,Math.min(100,totals.savingsRate));$('#savingsGauge').style.setProperty('--gauge-value',`${gaugePercent*1.8}deg`);$('#savingsGauge').setAttribute('aria-label',`${t('savingsRate')}: ${totals.savingsRate===null?t('noIncomeRate'):`${number(totals.savingsRate,1)}%`}`);
  const series=MerAccounting.monthSeries(state.transactions,reference,6),seriesDomain=MerCore.chartDomain(series.flatMap(item=>[item.income,item.expenses]));
  $('#monthlyBarChart').innerHTML=series.map(item=>`<div class="month-bar-group"><div><span class="income-month-bar" style="height:${MerCore.scaleChartValue(item.income,seriesDomain,96,5)}px" title="${t('income')}: ${currency(item.income)}"></span><span class="expense-month-bar" style="height:${MerCore.scaleChartValue(item.expenses,seriesDomain,96,5)}px" title="${t('expense')}: ${currency(item.expenses)}"></span></div><small>${new Intl.DateTimeFormat(locale(),{month:'short'}).format(new Date(`${item.key}-01T12:00:00`))}</small></div>`).join('');$('#monthlyBarChart').setAttribute('aria-label',`${t('incomeVsExpenses')}: ${series.map(item=>`${insightMonthLabel(item.key)}, ${t('income')} ${currency(item.income)}, ${t('expense')} ${currency(item.expenses)}`).join('; ')}`);
  const categoryLeaders=breakdown.slice(0,5),categoryLeaderDomain=MerCore.chartDomain(categoryLeaders.map(([,amount])=>amount));$('#topMerchantsList').innerHTML=categoryLeaders.length?categoryLeaders.map(([id,amount],index)=>`<div class="merchant-row"><b>${index+1}</b><span><strong>${escapeHtml(categoryName(id))}</strong><i><em style="width:${MerCore.scaleChartValue(amount,categoryLeaderDomain,100,2)}%"></em></i></span><small>${currency(amount,true)}</small></div>`).join(''):`<div class="notification-empty">${t('noExpensesPeriod')}</div>`;
  $$('[data-insight-detail]').forEach(card=>card.setAttribute('aria-label',`${card.querySelector('h2,.card-label span')?.textContent||t('reportDetails')} · ${currentLang==='hr'?'otvori detaljni prikaz':'open detailed view'}`));
  if($('#insightChartModal')?.open&&activeInsightDetail)renderInsightDetail(activeInsightDetail);
  renderIncomeCategories();
  renderSubscriptions();
}

const insightDetailCopy = {
  hr: {
    overline:'PROŠIRENI UVID',
    noData:'Još nema podataka za odabrano razdoblje.',
    income:'Ukupni prihodi',expenses:'Ukupni troškovi',net:'Neto rezultat',transactions:'Broj transakcija',average:'Prosječna transakcija',categories:'Aktivne kategorije',topCategory:'Najveća kategorija',monthlyAverage:'Mjesečni prosjek',latestMonth:'Zadnji mjesec',bestMonth:'Najbolji mjesec',savingsRate:'Stopa štednje',period:'Odabrano razdoblje',ofExpenses:'udjela u troškovima',ofIncome:'od prihoda',
    netView:{title:'Neto rezultat',intro:'Odnos prihoda i troškova kroz 12 mjeseci pokazuje koliko novca stvarno ostaje na raspolaganju.'},
    incomeView:{title:'Trend prihoda',intro:'Prošireni pregled svih izvora prihoda, njihove učestalosti i kretanja kroz vrijeme.'},
    expensesView:{title:'Trend potrošnje',intro:'Detaljan pregled ukupne potrošnje i mjesečnog ritma odlaznih transakcija.'},
    categoryView:{title:'Potrošnja po kategoriji',intro:'Struktura troškova pokazuje gdje odlazi najveći dio budžeta i koliki je udio svake kategorije.'},
    cashflowView:{title:'Prihodi i troškovi',intro:'Usporedite mjesečne priljeve i odljeve te brzo prepoznajte promjene u novčanom toku.'},
    merchantsView:{title:'Najveće kategorije',intro:'Rangirani pregled kategorija prema ukupnoj potrošnji u odabranom razdoblju.'},
    savingsView:{title:'Stopa štednje',intro:'Pratite koliki dio prihoda ostaje nakon troškova i kako se stopa mijenja iz mjeseca u mjesec.'}
  },
  en: {
    overline:'EXPANDED INSIGHT',
    noData:'There is no data for the selected period yet.',
    income:'Total income',expenses:'Total expenses',net:'Net result',transactions:'Transaction count',average:'Average transaction',categories:'Active categories',topCategory:'Largest category',monthlyAverage:'Monthly average',latestMonth:'Latest month',bestMonth:'Best month',savingsRate:'Savings rate',period:'Selected period',ofExpenses:'of expenses',ofIncome:'of income',
    netView:{title:'Net result',intro:'The 12-month income and expense relationship shows how much money is actually left available.'},
    incomeView:{title:'Income trend',intro:'An expanded view of every income source, its frequency, and movement over time.'},
    expensesView:{title:'Spending trend',intro:'A detailed view of total spending and the monthly rhythm of outgoing transactions.'},
    categoryView:{title:'Spending by category',intro:'The spending mix shows where most of the budget goes and the share held by each category.'},
    cashflowView:{title:'Income and expenses',intro:'Compare monthly inflows and outflows and quickly identify changes in cash flow.'},
    merchantsView:{title:'Largest categories',intro:'A ranked view of categories by total spend during the selected period.'},
    savingsView:{title:'Savings rate',intro:'Track how much income remains after expenses and how the rate changes from month to month.'}
  }
};

function insightMonthLabel(key,long=false) {
  return new Intl.DateTimeFormat(locale(),{month:long?'long':'short',year:long?'numeric':undefined}).format(new Date(`${key}-01T12:00:00`));
}

function expandedMetric(label,value) {
  return `<div class="insight-expanded-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function expandedNotes(items) {
  return items.map(item=>`<div class="insight-detail-note"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(String(item.value))}</strong></div>`).join('');
}

function expandedMonthChart(series,mode,copy) {
  const values=series.flatMap(item=>mode==='income'?[item.income]:mode==='expenses'?[item.expenses]:[item.income,item.expenses]);
  const domain=MerCore.chartDomain(values);
  if(!values.some(value=>value>0))return `<div class="notification-empty">${escapeHtml(copy.noData)}</div>`;
  return `<div class="expanded-month-chart" role="img" aria-label="${escapeHtml(copy.period)}">${series.map(item=>{
    const incomeHeight=MerCore.scaleChartValue(item.income,domain,168,5),expenseHeight=MerCore.scaleChartValue(item.expenses,domain,168,5);
    const bars=mode==='income'?`<i class="income" style="height:${incomeHeight}px" title="${escapeHtml(copy.income)}: ${currency(item.income)}"></i>`:mode==='expenses'?`<i class="expense" style="height:${expenseHeight}px" title="${escapeHtml(copy.expenses)}: ${currency(item.expenses)}"></i>`:`<i class="income" style="height:${incomeHeight}px" title="${escapeHtml(copy.income)}: ${currency(item.income)}"></i><i class="expense" style="height:${expenseHeight}px" title="${escapeHtml(copy.expenses)}: ${currency(item.expenses)}"></i>`;
    return `<div class="expanded-month-column" aria-label="${escapeHtml(insightMonthLabel(item.key,true))}: ${copy.income} ${currency(item.income)}, ${copy.expenses} ${currency(item.expenses)}"><div class="expanded-month-bars">${bars}</div><small>${escapeHtml(insightMonthLabel(item.key))}</small></div>`;
  }).join('')}</div>`;
}

function renderInsightDetail(kind) {
  const modal=$('#insightChartModal');if(!modal)return;
  const copy=insightDetailCopy[currentLang];
  const filtered=MerCore.filterTransactions(state.transactions,insightsTimeframe,appReferenceDate);
  const totals=derivedTotals(insightsTimeframe);
  const incomes=filtered.filter(tx=>MerCore.transactionType(tx)==='income');
  const expenses=filtered.filter(tx=>MerCore.transactionType(tx)==='expense');
  const series=MerAccounting.monthSeries(state.transactions,appReferenceDate,12);
  const byCategory=MerCore.categoryExpenseTotals(state.transactions,insightsTimeframe,appReferenceDate);
  const categories=Object.entries(byCategory).filter(([,amount])=>amount>0).sort((a,b)=>b[1]-a[1]);
  const expenseTotal=categories.reduce((sum,[,amount])=>sum+amount,0);
  const palette=['#16574b','#00a9e4','#93c841','#f49727','#ff5259','#7b6eb4','#65c4b2'];
  const viewKey={net:'netView',income:'incomeView',expenses:'expensesView',category:'categoryView',cashflow:'cashflowView',merchants:'merchantsView','savings-rate':'savingsView'}[kind]||'cashflowView';
  const viewCopy=copy[viewKey];
  $('#insightChartOverline').textContent=copy.overline;
  $('#insightChartTitle').textContent=viewCopy.title;
  $('#insightChartIntro').textContent=viewCopy.intro;

  let metrics=[];let chart='';let notes=[];
  const latest=series.at(-1)||{key:appReferenceDate.slice(0,7),income:0,expenses:0};
  const best=series.reduce((chosen,item)=>(item.income-item.expenses)>(chosen.income-chosen.expenses)?item:chosen,series[0]||latest);
  const monthlyExpenseAverage=series.reduce((sum,item)=>sum+item.expenses,0)/Math.max(1,series.length);
  const historyNotes=[
    {label:copy.latestMonth,value:`${insightMonthLabel(latest.key,true)} · ${currency(latest.income-latest.expenses)}`},
    {label:copy.monthlyAverage,value:currency(monthlyExpenseAverage)},
    {label:copy.bestMonth,value:`${insightMonthLabel(best.key,true)} · ${currency(best.income-best.expenses)}`}
  ];

  if(kind==='income'){
    metrics=[{label:copy.income,value:currency(totals.income)},{label:copy.average,value:currency(incomes.length?totals.income/incomes.length:0)},{label:copy.transactions,value:incomes.length}];
    chart=expandedMonthChart(series,'income',copy);notes=historyNotes;
  }else if(kind==='expenses'){
    metrics=[{label:copy.expenses,value:currency(totals.expenses)},{label:copy.average,value:currency(expenses.length?totals.expenses/expenses.length:0)},{label:copy.transactions,value:expenses.length}];
    chart=expandedMonthChart(series,'expenses',copy);notes=historyNotes;
  }else if(kind==='category'){
    metrics=[{label:copy.expenses,value:currency(expenseTotal)},{label:copy.categories,value:categories.length},{label:copy.topCategory,value:categories[0]?categoryName(categories[0][0]):'—'}];
    const segments=MerCore.proportionalSegments(categories).map((segment,index)=>({id:segment.entry[0],amount:segment.value,start:segment.start,end:segment.end,color:palette[index%palette.length]}));
    const gradient=segments.length?`conic-gradient(${segments.map(segment=>`${segment.color} ${segment.start}% ${segment.end}%`).join(',')})`:'var(--line)';
    chart=`<div class="expanded-donut-layout"><div class="expanded-donut" style="background:${gradient}"><span><strong>${currency(expenseTotal,true)}</strong><small>${escapeHtml(copy.expenses)}</small></span></div><div class="expanded-ranked-list">${segments.slice(0,6).map(segment=>{const share=segment.end-segment.start;return `<div class="expanded-ranked-row"><span><i style="background:${segment.color}"></i>${escapeHtml(categoryName(segment.id))}</span><strong>${currency(segment.amount,true)} · ${number(share,0)}%</strong><div class="expanded-ranked-track"><i style="width:${share}%;background:${segment.color}"></i></div></div>`;}).join('')||`<div class="notification-empty">${escapeHtml(copy.noData)}</div>`}</div></div>`;
    notes=segments.slice(0,3).map(segment=>({label:categoryName(segment.id),value:`${currency(segment.amount)} · ${number(segment.end-segment.start,0)}% ${copy.ofExpenses}`}));
  }else if(kind==='merchants'){
    const categoryDomain=MerCore.chartDomain(categories.map(([,amount])=>amount));
    metrics=[{label:copy.expenses,value:currency(expenseTotal)},{label:copy.categories,value:categories.length},{label:copy.topCategory,value:categories[0]?categoryName(categories[0][0]):'—'}];
    chart=`<div class="expanded-ranked-list">${categories.slice(0,6).map(([id,amount],index)=>{const share=MerCore.ratioPercent(amount,expenseTotal,100);return `<div class="expanded-ranked-row"><span><i style="background:${palette[index%palette.length]}"></i>${escapeHtml(categoryName(id))}</span><strong>${currency(amount)} · ${number(share,0)}% ${escapeHtml(copy.ofExpenses)}</strong><div class="expanded-ranked-track"><i style="width:${MerCore.scaleChartValue(amount,categoryDomain,100,2)}%;background:${palette[index%palette.length]}"></i></div></div>`;}).join('')||`<div class="notification-empty">${escapeHtml(copy.noData)}</div>`}</div>`;
    notes=categories.slice(0,3).map(([id,amount])=>({label:categoryName(id),value:`${currency(amount)} · ${number(MerCore.ratioPercent(amount,expenseTotal,100),0)}% ${copy.ofExpenses}`}));if(!notes.length)notes=historyNotes;
  }else if(kind==='savings-rate'){
    const rate=totals.savingsRate,monthlyRates=series.map(item=>({...item,rate:item.income>0?(item.income-item.expenses)/item.income*100:null}));
    const validRates=monthlyRates.filter(item=>item.rate!==null),rateMax=Math.max(...validRates.map(item=>Math.abs(item.rate)),1);
    metrics=[{label:copy.savingsRate,value:rate===null?'—':`${number(rate,1)}%`},{label:copy.net,value:currency(totals.net)},{label:copy.income,value:currency(totals.income)}];
    const ringValue=Math.max(0,Math.min(100,rate||0))*3.6;
    chart=`<div class="expanded-savings-layout"><div class="expanded-savings-ring" style="--expanded-progress:${ringValue}deg"><span><strong>${rate===null?'—':`${number(rate,1)}%`}</strong><small>${escapeHtml(copy.ofIncome)}</small></span></div><div class="expanded-ranked-list">${monthlyRates.slice(-6).map(item=>`<div class="expanded-ranked-row"><span>${escapeHtml(insightMonthLabel(item.key,true))}</span><strong>${item.rate===null?'—':`${number(item.rate,1)}%`}</strong><div class="expanded-ranked-track"><i style="width:${item.rate===null?0:Math.abs(item.rate)/rateMax*100}%;background:${item.rate!==null&&item.rate<0?'var(--red)':'var(--green)'}"></i></div></div>`).join('')}</div></div>`;
    const averageRate=validRates.length?validRates.reduce((sum,item)=>sum+item.rate,0)/validRates.length:null,bestRate=validRates.reduce((chosen,item)=>!chosen||item.rate>chosen.rate?item:chosen,null);
    notes=[{label:copy.monthlyAverage,value:averageRate===null?'—':`${number(averageRate,1)}%`},{label:copy.bestMonth,value:bestRate?`${insightMonthLabel(bestRate.key,true)} · ${number(bestRate.rate,1)}%`:'—'},{label:copy.latestMonth,value:latest.income?`${number((latest.income-latest.expenses)/latest.income*100,1)}%`:'—'}];
  }else{
    metrics=[{label:copy.net,value:currency(totals.net)},{label:copy.income,value:currency(totals.income)},{label:copy.expenses,value:currency(totals.expenses)}];
    chart=expandedMonthChart(series,'cashflow',copy);notes=historyNotes;
  }
  $('#insightExpandedMetrics').innerHTML=metrics.map(item=>expandedMetric(item.label,item.value)).join('');
  $('#insightExpandedChart').innerHTML=chart;
  $('#insightExpandedBreakdown').innerHTML=expandedNotes(notes.slice(0,3));
}

function openInsightDetail(kind) {
  activeInsightDetail=kind;
  renderInsightDetail(kind);
  openModal($('#insightChartModal'));
}

function renderAll() {
  renderMonth();renderModuleTitle();renderAccountContext();renderOverview();renderBudgetLists();renderBudgetView();renderSavingsView();renderSavingsEntries();renderUpcoming();renderRecurring();renderCategorySelects();renderActivity();renderInsights();renderSubscriptions();renderNotifications();renderBankSyncStatus();if($('#connectedBanksModal').open)renderBankSettings();applyTheme();
}

function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'hr';
  applyStaticTranslations(); save('language-change');
}

function showToast(message) {
  const toast = $('#toast'); $('span',toast).textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('show'),2600);
}

function runAsyncAction(action,messageKey='syncFailed') { return Promise.resolve().then(action).catch(error=>{window.MerRuntime?.report?.(error,{silent:true});showToast(t(messageKey));return null;}); }

function closeCardMenus(exceptId=null) {
  $$('[data-card-menu]').forEach(trigger=>{
    const keepOpen=trigger.dataset.cardMenu===exceptId;
    const menu=$(`#${trigger.dataset.cardMenu}`);
    if(menu)menu.hidden=!keepOpen;
    trigger.setAttribute('aria-expanded',String(keepOpen));
  });
}

function syncModalLayer() {
  const hasOpenModal=Boolean($('.modal[open]'));
  $('#modalBackdrop').hidden=true;
  document.body.classList.toggle('modal-active',hasOpenModal);
  if(!hasOpenModal)hideTooltip();
}

function closeAllOverlays() {
  $$('.modal[open]').forEach(modal=>modal.close());
  closeCardMenus();
  closeNotifications();
  toggleAccountMenu(false);
  $('#modalBackdrop').hidden=true;
  document.body.classList.remove('modal-active');
  hideTooltip();
}

const modalReturnFocus=new WeakMap();
function focusableElements(modal){return $$('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',modal).filter(element=>!element.hidden&&element.getClientRects().length>0);}
function openModal(modal) {
  if(!modal||modal.open)return;
  const activeElement=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const mobileSidebarTrigger=window.innerWidth<768&&activeElement?.closest('#sidebar')?$('#menuToggle'):null;
  $$('.modal[open]').forEach(openDialog=>{if(openDialog!==modal)openDialog.close();});
  closeCardMenus();
  closeNotifications();
  toggleAccountMenu(false);
  if(window.innerWidth<768)closeSidebar();
  $('#modalBackdrop').hidden=true;
  if(mobileSidebarTrigger||activeElement)modalReturnFocus.set(modal,mobileSidebarTrigger||activeElement);
  modal.setAttribute('aria-modal','true');
  modal.showModal();
  document.body.classList.add('modal-active');
  requestAnimationFrame(()=>{const target=$('[autofocus]',modal)||focusableElements(modal)[0];target?.focus({preventScroll:true});});
}

function closeModal(modal) {
  if(modal?.open)modal.close();
  hideBankActionTooltip();
  syncModalLayer();
  const returnTarget=modal&&modalReturnFocus.get(modal),openDialog=$('.modal[open]');
  if(returnTarget?.isConnected&&(!openDialog||openDialog.contains(returnTarget)))requestAnimationFrame(()=>returnTarget.focus({preventScroll:true}));
}

const moduleTitleKeys = {overview:'navOverview',budgets:'navBudgets',savings:'navSavings',activity:'navActivity',insights:'navInsights'};
const contextHeaderKeys = {
  budgets:{title:'monthlyPlan',subtitle:'budgetsSubtitle'},
  savings:{title:'yourFuture',subtitle:'savingsSubtitle'},
  activity:{title:'moneyMovement',subtitle:'activitySubtitle'},
  insights:{title:'reports',subtitle:'insightsSubtitle'}
};
function renderModuleTitle(now=new Date()) {
  const title=$('#contextHeaderTitle'),subtitle=$('#contextHeaderSubtitle');
  if(!title||!subtitle)return;
  if(activeView==='overview'){
    title.textContent=t('dashboardGreeting');
    subtitle.textContent=t('overviewSubtitle');
  }else{
    const context=contextHeaderKeys[activeView]||contextHeaderKeys.budgets;
    title.textContent=t(context.title);
    subtitle.textContent=t(context.subtitle);
  }
  $('#contextHeader')?.setAttribute('data-view',activeView);
}

function showView(view) {
  closeAllOverlays();
  activeView = moduleTitleKeys[view]?view:'overview';
  $$('[data-view-panel]').forEach(panel => { const active=panel.dataset.viewPanel===activeView; panel.hidden=!active; panel.classList.toggle('active',active); });
  $$('.nav-item').forEach(item => { const active=item.dataset.view===activeView; item.classList.toggle('active',active); if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current'); });
  renderModuleTitle();
  closeSidebar();
  const activePanel=$(`[data-view-panel="${activeView}"]`);if(activePanel)activePanel.scrollTop=0;
}

function openSidebar() { $('#sidebar').classList.add('open'); $('#sidebarScrim').hidden=false; $('#menuToggle').setAttribute('aria-expanded','true'); $('#menuToggle').setAttribute('aria-label',t('closeNav')); }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebarScrim').hidden=true; $('#menuToggle').setAttribute('aria-expanded','false'); $('#menuToggle').setAttribute('aria-label',t('openNav')); }

function toggleAccountMenu(force) { const menu=$('#accountMenu'),willOpen=typeof force==='boolean'?force:menu.hidden;menu.hidden=!willOpen;$('#openSettings').setAttribute('aria-expanded',String(willOpen)); }
function closeNotifications(restoreFocus=false) { const wasOpen=!$('#notificationCenter').hidden;$('#notificationCenter').hidden=true;$('#notificationButton').setAttribute('aria-expanded','false');if(restoreFocus&&wasOpen)requestAnimationFrame(()=>$('#notificationButton').focus({preventScroll:true})); }
function toggleNotifications() { const open=$('#notificationCenter').hidden;$('#notificationCenter').hidden=!open;$('#notificationButton').setAttribute('aria-expanded',String(open));if(open)toggleAccountMenu(false); }
function switchAccount(accountId) { if(!appState.accounts[accountId]||accountId===appState.activeAccount)return;appState.activeAccount=accountId;state=appState.accounts[accountId];activityReviewOnly=false;activityPage=1;processDueRecurring(state);save('account-switch');toggleAccountMenu(false);showView('overview');showToast(t('accountSwitched',{account:state.accountName})); }
function setTheme(nextTheme) { currentTheme=nextTheme==='dark'?'dark':'light';applyTheme();save('theme-change'); }

function processDueRecurring(profile) {
  if(!profile||typeof profile!=='object')return 0;
  profile.recurring=Array.isArray(profile.recurring)?profile.recurring:[];profile.transactions=Array.isArray(profile.transactions)?profile.transactions:[];
  let imported=0;
  profile.recurring.forEach(rule=>{if(!rule||!validStoredDate(rule.startDate)||rule.enabled===false)return;const start=new Date(`${String(rule.startDate).slice(0,10)}T12:00:00Z`);const from=validStoredDate(rule.lastProcessed)?String(rule.lastProcessed).slice(0,10):new Date(start.getTime()-86400000).toISOString().slice(0,10);MerCore.occurrencesBetween(rule,from,appReferenceDate).forEach(date=>{const key=`${rule.id}:${date}`;if(profile.transactions.some(tx=>tx?.recurringKey===key))return;const cat=profile.categories.find(item=>item.id===rule.category)||profile.categories[0];if(!cat)return;profile.transactions.unshift({id:`rec-${key}`,type:'expense',name:String(rule.name||'Ponavljajući trošak').slice(0,80),amount:Math.abs(Number(rule.amount)||0),category:cat.id,date:`${date}T08:00:00`,recurringKey:key,source:'Manual',sourceType:'manual',needsReview:false});imported+=1;});rule.lastProcessed=appReferenceDate;});
  return imported;
}

let activeTooltipTrigger=null;
function showTooltip(trigger) {
  const tip=$('#appTooltip'),visual=window.visualViewport,bounds=visual?{left:visual.offsetLeft,top:visual.offsetTop,width:visual.width,height:visual.height}:{left:0,top:0,width:window.innerWidth,height:window.innerHeight};
  if(activeTooltipTrigger&&activeTooltipTrigger!==trigger)activeTooltipTrigger.removeAttribute('aria-describedby');
  activeTooltipTrigger=trigger;tip.textContent=t(trigger.dataset.tooltipKey);tip.hidden=false;tip.style.transform='none';
  const rect=trigger.getBoundingClientRect(),tipRect=tip.getBoundingClientRect(),edge=8,gap=8,width=Math.min(260,bounds.width-edge*2);
  const left=Math.max(bounds.left+edge,Math.min(bounds.left+bounds.width-width-edge,rect.left+rect.width/2-width/2));
  const above=rect.top-tipRect.height-gap>=bounds.top+edge;
  const top=above?rect.top-tipRect.height-gap:Math.min(bounds.top+bounds.height-tipRect.height-edge,rect.bottom+gap);
  tip.style.width=`${width}px`;tip.style.left=`${left}px`;tip.style.top=`${Math.max(bounds.top+edge,top)}px`;tip.dataset.side=above?'top':'bottom';trigger.setAttribute('aria-describedby','appTooltip');
}
function hideTooltip() { const tip=$('#appTooltip');tip.hidden=true;activeTooltipTrigger?.removeAttribute('aria-describedby');activeTooltipTrigger=null; }

function resetTransactionCheck() {
  $('#transactionSubmit').disabled=true;
  $('#transactionAmount').setAttribute('aria-invalid','false');
  $('#transactionDate').setAttribute('aria-invalid','false');
  const check=$('#spendCheck');
  check.className='spend-check';check.hidden=true;
  check.dataset.budgetWarning='';check.dataset.monthlyOver='0';check.dataset.categoryOver='0';
  check.replaceChildren();
}

function transactionAffectsCurrentBudget(transaction) {
  return MerCore.isTransactionEffective(transaction,appReferenceDate)&&String(transaction?.date||'').startsWith(appReferenceDate.slice(0,7));
}

function setTransactionType(type) {
  transactionType=type==='income'?'income':'expense';
  $$('[data-transaction-type]').forEach(button=>{const active=button.dataset.transactionType===transactionType;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  $('#transactionOverline').textContent=t(transactionType==='income'?'recordIncome':'recordSpending');
  $('#transactionIntro').textContent=t(transactionType==='income'?'incomeIntro':'transactionIntro');
  $('#transactionName').setAttribute('placeholder',t(transactionType==='income'?'incomePlaceholder':'merchantPlaceholder'));
  const existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;
  $('#transactionTitle').textContent=t(existing?(transactionType==='income'?'editIncome':'editExpense'):(transactionType==='income'?'addIncome':'addExpense'));
  $('#transactionSubmit').textContent=t(existing?(transactionType==='income'?'updateIncome':'updateExpense'):(transactionType==='income'?'addIncomeSubmit':'addExpenseSubmit'));
  renderCategorySelects();resetTransactionCheck();evaluateTransaction();
}

function evaluateTransaction() {
  const amountInput=$('#transactionAmount'),rawAmount=amountInput.value.trim(),amount=Number(rawAmount);
  const dateInput=$('#transactionDate'),dateValue=String(dateInput.value||'').slice(0,10);
  const existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;
  const check=$('#spendCheck');
  if(!rawAmount){resetTransactionCheck();return false;}
  check.hidden=false;
  if(!validStoredDate(dateValue)){check.className='spend-check danger';check.innerHTML=`<svg aria-hidden="true"><use href="#icon-alert"></use></svg><div><strong>${t('transactionDateRequired')}</strong></div>`;dateInput.setAttribute('aria-invalid','true');$('#transactionSubmit').disabled=true;return false;}
  dateInput.setAttribute('aria-invalid','false');
  if(!Number.isFinite(amount)||amount<=0){check.className='spend-check danger';check.dataset.budgetWarning='';check.dataset.monthlyOver='0';check.dataset.categoryOver='0';check.innerHTML=`<svg aria-hidden="true"><use href="#icon-alert"></use></svg><div><strong>${t('positiveAmountRequired')}</strong></div>`;amountInput.setAttribute('aria-invalid','true');$('#transactionSubmit').disabled=true;return false;}
  amountInput.setAttribute('aria-invalid','false');
  if(dateValue>appReferenceDate){
    check.className='spend-check scheduled';check.dataset.budgetWarning='';check.dataset.monthlyOver='0';check.dataset.categoryOver='0';
    check.innerHTML=`<svg aria-hidden="true"><use href="#icon-calendar"></use></svg><div><strong>${t('scheduledTransaction')}</strong><span>${t('scheduledTransactionNotice',{date:formatIsoDate(dateValue)})}</span></div>`;
    $('#transactionSubmit').disabled=false;return true;
  }
  if(transactionType==='income'){
    check.className='spend-check success';
    check.dataset.budgetWarning='';check.dataset.monthlyOver='0';check.dataset.categoryOver='0';
    const existingAdjustment=existing&&MerCore.isTransactionEffective(existing,appReferenceDate)?(MerCore.transactionType(existing)==='income'?-existing.amount:existing.amount):0;
    const existingSafeAdjustment=existing&&transactionAffectsCurrentBudget(existing)?(MerCore.transactionType(existing)==='income'?-existing.amount:existing.amount):0;
    const projectedSafe=getPlan().safeRemaining+existingSafeAdjustment+(dateValue.startsWith(appReferenceDate.slice(0,7))?amount:0);
    check.innerHTML=`<svg aria-hidden="true"><use href="#icon-up"></use></svg><div><strong>${t('incomeReady')}</strong><span>${t('incomeImpact',{balance:currency(state.availableBalance+existingAdjustment+amount),safe:currency(projectedSafe)})}</span></div>`;
    $('#transactionSubmit').disabled=false;return true;
  }
  const cat=state.categories.find(item=>item.id===$('#transactionCategory').value) || state.categories[0];
  const oldExpense=existing&&MerCore.transactionType(existing)==='expense'&&transactionAffectsCurrentBudget(existing)?existing.amount:0;
  const plan=getPlan();
  const impact=MerCore.assessExpenseImpact({amount,currentSpent:state.spent,monthlyBudget:plan.monthlyBudget,categorySpent:cat.spent,categoryLimit:cat.limit,dailyBudget:plan.safeDaily,editingAmount:oldExpense,editingSameCategory:Boolean(oldExpense&&existing?.category===cat.id)});
  let title=t('transactionSafe',{amount:currency(impact.monthlyRemaining)}),note=t('transactionSafeNote');
  if(impact.warning==='monthly-over'){title=t('transactionTotalBlocked');note=t('reduceBy',{amount:currency(impact.monthlyOver)});}
  else if(impact.warning==='category-over'){title=t('transactionCategoryBlocked');note=t('categoryOverBy',{category:categoryName(cat.id),amount:currency(impact.categoryOver)});}
  else if(impact.warning==='daily-over'){title=t('transactionDailyWarning');note=t('transactionDailySoftNote',{amount:currency(plan.safeDaily)});}
  else if(impact.warning==='category-near'){title=t('transactionWarning');note=t('categoryAfter',{amount:currency(impact.categoryRemaining)});}
  check.className=`spend-check ${impact.level}`.trim();
  check.dataset.budgetWarning=impact.warning||'';check.dataset.monthlyOver=String(impact.monthlyOver);check.dataset.categoryOver=String(impact.categoryOver);
  const icon=impact.level==='danger'||impact.level==='warning'?'alert':impact.valid?'check':'shield';
  check.innerHTML=`<svg aria-hidden="true"><use href="#icon-${icon}"></use></svg><div><strong>${title}</strong><span>${note}</span></div>`;
  $('#transactionSubmit').disabled=!impact.valid;
  return impact.valid;
}

function openTransaction(id=null) {
  editingTransactionId=id===null?null:id;$('#transactionForm').reset();
  const existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;
  $('#transactionDate').value=String(existing?.date||appReferenceDate).slice(0,10);
  transactionType=MerCore.transactionType(existing);setTransactionType(transactionType);$('#deleteTransaction').hidden=!existing;
  if(existing){$('#transactionName').value=existing.name;$('#transactionAmount').value=existing.amount;renderCategorySelects();$('#transactionCategory').value=existing.category;evaluateTransaction();}
  openModal($('#transactionModal'));setTimeout(()=>$('#transactionName').focus(),50);
}

function openIncomeTransaction() { editingTransactionId=null;$('#transactionForm').reset();$('#transactionDate').value=appReferenceDate;transactionType='income';setTransactionType('income');$('#deleteTransaction').hidden=true;openModal($('#transactionModal'));setTimeout(()=>$('#transactionName').focus(),50); }

function setAssessmentStep(step) {
  assessmentStep=step;
  $$('.assessment-step').forEach(section=>section.classList.toggle('active',Number(section.dataset.step)===step));
  $$('.step-dots span').forEach((dot,index)=>dot.classList.toggle('active',index<step));
  $('#assessmentBack').hidden=step===1; $('#assessmentNext').hidden=step===3; $('#assessmentSave').hidden=step!==3;
  if(step===3)updateRecommendation();
}

function openAssessment() {
  $('#incomeInput').value=state.income; $('#billsInput').value=state.bills; $('#savingsInput').value=state.savingsTarget; $('#savingsBalanceInput').value=state.savingsBalance;
  $('#savingsBalancePlanHint').textContent=currentLang==='hr'?'Ukupno u svim ciljevima. Stanje mijenjajte uplatama ili uređivanjem ciljeva štednje.':'Total across all goals. Update this balance through deposits or savings goal edits.';
  const guardInputs=$$('#assessmentForm input[name="guard"]');
  const selected=guardInputs.find(input=>Number(input.value)===Number(state.guard))||guardInputs.find(input=>Number(input.value)===.1);
  guardInputs.forEach(input=>{input.checked=input===selected;});
  $$('#assessmentForm input[type="number"]').forEach(input=>{input.step='0.01';});
  setAssessmentStep(1); openModal($('#assessmentModal'));
}

function readAssessmentPlan() {
  const fields=['incomeInput','billsInput','savingsInput'].map(id=>$(`#${id}`));
  const values=fields.map(input=>Number(input.value));
  const [income,bills,savings]=values;
  const guard=Number($('#assessmentForm input[name="guard"]:checked')?.value);
  const valid=fields.every((input,index)=>input.value.trim()!==''&&Number.isFinite(values[index])&&values[index]>=0&&Number.isSafeInteger(Math.round(values[index]*100)))&&[.05,.1,.15].includes(guard);
  return {income,bills,savings,guard,valid,budget:valid?MerCore.roundMoney(income-bills-savings-income*guard):0};
}

function updateRecommendation() {
  const plan=readAssessmentPlan();
  $('#recommendedBudget').textContent=t('planPerMonth',{amount:currency(Math.max(0,plan.budget),true)});
  $('#assessmentSave').disabled=!plan.valid;
  $('.plan-preview').classList.toggle('invalid',!plan.valid||plan.budget<0);
  const notice=$('#assessmentNotice');
  if(notice){
    const copy=currentLang==='hr'?{
      invalid:'Unesite valjane nenegativne iznose i odaberite sigurnosnu rezervu.',
      commitments:'Obveze, štednja i rezerva prelaze planirani prihod. Plan možete spremiti, ali za kategorije trenutačno ostaje 0 €.',
      spent:'Nova ograničenja niža su od već zabilježene potrošnje. Plan možete spremiti; postojeće transakcije ostaju nepromijenjene.'
    }:{
      invalid:'Enter valid non-negative amounts and choose a safety reserve.',
      commitments:'Bills, savings and reserve exceed planned income. You can save this plan, but category budgets will be zero for now.',
      spent:'The new limits are below spending already recorded. You can save this plan; existing transactions remain unchanged.'
    };
    notice.textContent=!plan.valid?copy.invalid:plan.budget<0?copy.commitments:plan.budget<state.spent?copy.spent:'';
    notice.hidden=!notice.textContent;
  }
  return plan;
}

function scaleCategoryLimits(newBudget) {
  const categories=state.categories||[];
  if(!categories.length)return;
  const targetCents=Math.max(0,Math.round(newBudget*100));
  const weights=categories.map(cat=>Math.max(0,Number(cat.limit)||0));
  const totalWeight=weights.reduce((sum,value)=>sum+value,0);
  const shares=categories.map((cat,index)=>{const exact=targetCents*(totalWeight?weights[index]/totalWeight:1/categories.length);return {cat,index,cents:Math.floor(exact),remainder:exact-Math.floor(exact)};});
  const remaining=targetCents-shares.reduce((sum,item)=>sum+item.cents,0);
  shares.sort((a,b)=>b.remainder-a.remainder||a.index-b.index).forEach((item,index)=>{item.cat.limit=(item.cents+(index<remaining?1:0))/100;});
}

function applyAssessmentPlan(event) {
  event.preventDefault();
  const plan=updateRecommendation();
  if(!plan.valid){showToast(currentLang==='hr'?'Provjerite iznose i odaberite rezervu.':'Check the amounts and choose a reserve.');return;}
  // Planning assumptions never create transactions or overwrite actual savings balances.
  state.income=plan.income;state.bills=plan.bills;state.savingsTarget=plan.savings;state.guard=plan.guard;
  scaleCategoryLimits(Math.max(0,plan.budget));
  save('plan-update');closeModal($('#assessmentModal'));showToast(t('planReady'));
}

function openBudgetEditor(id=null) {
  editingCategoryId=id;const cat=id?state.categories.find(item=>item.id===id):null,plan=getPlan(),otherAllocated=state.categories.reduce((sum,item)=>sum+item.limit,0)-(cat?.limit||0),bounds=MerCore.validateCategoryLimit(cat?.limit||0,cat?.spent||0,otherAllocated,plan.monthlyBudget),minimum=Math.max(0,bounds.minimum),maximum=Math.max(minimum,bounds.maximum);
  $('#budgetModalTitle').textContent=cat?categoryName(cat.id):t('newCategory');$('#categoryNameInput').value=cat?categoryName(cat.id):'';$('#categoryNameInput').disabled=Boolean(cat&&!cat.isCustom);$('#categoryIconInput').value=cat?(categoryVisual(cat).icon||''):'';$('#categoryIconInput').disabled=Boolean(cat&&!cat.isCustom);$('#budgetLimitInput').value=cat?cat.limit:'';$('#budgetLimitInput').min=minimum.toFixed(2);$('#budgetLimitInput').max=maximum.toFixed(2);$('#deleteCategory').hidden=!cat?.isCustom;
  $('#budgetModalContext').textContent=cat?t('spentCategory',{spent:currency(cat.spent),minimum:currency(minimum),maximum:currency(maximum)}):t('accountIsolation');openModal($('#budgetModal'));setTimeout(()=>$('#categoryNameInput').disabled?$('#budgetLimitInput').select():$('#categoryNameInput').focus(),50);
}

function refreshBudgetTransferForm() {
  const targets=state.categories.filter(cat=>cat.spent>cat.limit+.005),targetSelect=$('#budgetTransferTarget'),sourceSelect=$('#budgetTransferSource'),previousTarget=targetSelect.value,previousSource=sourceSelect.value;
  targetSelect.innerHTML=targets.map(cat=>`<option value="${escapeHtml(cat.id)}">${escapeHtml(categoryName(cat.id))} · +${currency(cat.spent-cat.limit,true)}</option>`).join('');
  if(targets.some(cat=>cat.id===previousTarget))targetSelect.value=previousTarget;
  const target=state.categories.find(cat=>cat.id===targetSelect.value)||targets[0],donors=state.categories.filter(cat=>cat.id!==target?.id&&cat.limit>cat.spent+.005);
  sourceSelect.innerHTML=donors.map(cat=>`<option value="${escapeHtml(cat.id)}">${escapeHtml(categoryName(cat.id))} · ${currency(cat.limit-cat.spent,true)}</option>`).join('');
  if(donors.some(cat=>cat.id===previousSource))sourceSelect.value=previousSource;
  const source=state.categories.find(cat=>cat.id===sourceSelect.value)||donors[0],available=Math.max(0,source?(source.limit-source.spent):0),overage=Math.max(0,target?(target.spent-target.limit):0),maximum=Math.min(available,overage),amountInput=$('#budgetTransferAmount');
  amountInput.max=maximum.toFixed(2);amountInput.value=maximum>0?maximum.toFixed(2):'';
  $('#budgetTransferContext').textContent=t('transferContext',{available:currency(available),overage:currency(overage)});
  $('#budgetTransferForm button[type="submit"]').disabled=maximum<=0;
}

function openBudgetTransfer() {
  refreshBudgetTransferForm();
  if(!$('#budgetTransferTarget').options.length||!$('#budgetTransferSource').options.length){showToast(t('transferInvalid'));return;}
  openModal($('#budgetTransferModal'));
}

function fallbackCategory(excludingId) {
  let fallback=state.categories.find(cat=>cat.id==='other'&&cat.id!==excludingId);
  if(!fallback){fallback={id:'other',spent:0,limit:0};state.categories.push(fallback);}
  return fallback;
}

function updateSavingsCheck() {
  const amount=Number($('#savingsAmountInput').value)||0,existing=editingSavingsId!==null?(state.savingsEntries||[]).find(entry=>String(entry.id)===String(editingSavingsId)):null; const available=Math.max(0,state.availableBalance-state.bills+(existing?.amount||0)); const blocked=amount>available; const remaining=Math.max(0,state.availableBalance+(existing?.amount||0)-amount);
  $('#savingsCheck').className=`spend-check ${blocked?'danger':'success'}`;
  $('#savingsCheck').innerHTML=`<svg aria-hidden="true"><use href="#icon-${blocked?'shield':'check'}"></use></svg><div><strong>${blocked?t('depositBlocked'):t('depositSafe',{amount:currency(remaining)})}</strong><span>${blocked?t('depositMax',{amount:currency(available)}):t('billsRemain')}</span></div>`;
  $('#savingsSubmit').disabled=blocked||amount<=0; return !blocked&&amount>0;
}

function openSavingsDeposit(id=null) { editingSavingsId=id===null?null:id;const existing=editingSavingsId!==null?(state.savingsEntries||[]).find(entry=>String(entry.id)===String(editingSavingsId)):null;const goals=state.goalBuckets||[];$('#savingsGoalInput').innerHTML=goals.map(goal=>`<option value="${goal.id}">${escapeHtml(goal.name)}</option>`).join('');$('#savingsGoalInput').value=existing?.goalId||goals.find(goal=>goal.primary)?.id||goals[0]?.id||'';$('#savingsNoteInput').value=existing?.note||(currentLang==='hr'?'Uplata u štednju':'Savings deposit');$('#savingsAmountInput').value=existing?.amount||Math.min(state.savingsTarget,Math.max(1,state.availableBalance-state.bills));$('#savingsModalTitle').textContent=t(existing?'editSavingsEntry':'addToSavingsGoal');$('#savingsSubmit').textContent=t(existing?'updateSavings':'confirmDeposit');$('#deleteSavingsEntry').hidden=!existing;updateSavingsCheck();openModal($('#savingsModal'));setTimeout(()=>$('#savingsNoteInput').focus(),50); }
function savingsHistoryIndexFor(dateValue){if(!validStoredDate(dateValue))return state.savingsHistory.length-1;const currentYear=Number(appReferenceDate.slice(0,4)),currentMonth=Number(appReferenceDate.slice(5,7)),entryYear=Number(String(dateValue).slice(0,4)),entryMonth=Number(String(dateValue).slice(5,7)),monthsAgo=(currentYear-entryYear)*12+currentMonth-entryMonth,index=state.savingsHistory.length-1-monthsAgo;return index>=0&&index<state.savingsHistory.length?index:null;}

function updateRecurringPreview() { const day=Number($('#recurringDayInput').value)||1,start=$('#recurringStartInput').value||appReferenceDate;if(day<1||day>31||!validStoredDate(start)){$('#recurringPreview').textContent=t('recurringInvalidDay');return false;}const next=MerCore.nextOccurrence({day,startDate:start,enabled:true},appReferenceDate,true);if(!next){$('#recurringPreview').textContent=t('recurringInvalidDay');return false;}$('#recurringPreview').textContent=`${t('nextCharge',{date:formatIsoDate(next)})} ${t('recurringPreview')}`;return true; }
function openRecurring(id=null) { editingRecurringId=id===null?null:id;const existing=editingRecurringId!==null?(state.recurring||[]).find(rule=>String(rule.id)===String(editingRecurringId)):null;const nextMonth=new Date(`${appReferenceDate}T12:00:00Z`);nextMonth.setUTCMonth(nextMonth.getUTCMonth()+1,1);renderCategorySelects();$('#recurringModalTitle').textContent=t(existing?'editExpense':'scheduleExpense');$('#recurringNameInput').value=existing?.name||'';$('#recurringAmountInput').value=existing?.amount||'';$('#recurringCategoryInput').value=existing?.category||state.categories[0]?.id;$('#recurringDayInput').value=existing?.day||1;$('#recurringStartInput').value=existing?.startDate||nextMonth.toISOString().slice(0,10);$('#deleteRecurring').hidden=!existing;updateRecurringPreview();openModal($('#recurringModal'));setTimeout(()=>$('#recurringNameInput').focus(),50); }

function openIncomeCategoryEditor(id=null) {
  editingIncomeCategoryId=id;const cat=id?state.incomeCategories.find(item=>item.id===id):null;if(cat&&!cat.isCustom)return;
  $('#incomeCategoryModalTitle').textContent=cat?incomeCategoryName(cat.id):t('newIncomeCategory');$('#incomeCategoryNameInput').value=cat?incomeCategoryName(cat.id):'';$('#incomeCategoryIconInput').value=cat?.icon||'';$('#deleteIncomeCategory').hidden=!cat;openModal($('#incomeCategoryModal'));setTimeout(()=>$('#incomeCategoryNameInput').focus(),50);
}

$$('[data-close-modal]').forEach(button=>button.addEventListener('click',()=>closeModal(button.closest('dialog'))));
$$('.modal').forEach(modal=>{
  modal.setAttribute('aria-modal','true');
  modal.addEventListener('cancel',event=>{event.preventDefault();closeModal(modal);});
  modal.addEventListener('close',()=>{if(modal.id==='insightChartModal')activeInsightDetail=null;syncModalLayer();});
  window.MerRuntime.bindDialogBackdropDismiss(modal,()=>closeModal(modal));
  modal.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const focusable=focusableElements(modal);if(!focusable.length){event.preventDefault();modal.focus();return;}const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
});
$('#modalBackdrop').addEventListener('click',closeAllOverlays);
$$('[data-open-detail]').forEach(button=>button.addEventListener('click',()=>{const modal=$(`#${button.dataset.openDetail}`);if(modal)openModal(modal);}));
$$('[data-open-transaction]').forEach(button=>button.addEventListener('click',()=>openTransaction()));
$$('[data-open-income]').forEach(button=>button.addEventListener('click',openIncomeTransaction));
$$('[data-open-assessment]').forEach(button=>button.addEventListener('click',openAssessment));
$$('[data-open-savings-strategy]').forEach(button=>button.addEventListener('click',()=>{renderSavingsView();openModal($('#savingsStrategyModal'));}));
$$('[data-open-savings]').forEach(button=>button.addEventListener('click',()=>openSavingsDeposit()));
$('#openSettings').addEventListener('click',event=>{event.stopPropagation();toggleAccountMenu();closeNotifications();}); $('#safeBreakdown').addEventListener('click',()=>openModal($('#breakdownModal')));
$('#manageBanks').addEventListener('click',openBankSettings);
$('#startBankConnection').addEventListener('click',startBankConnection);
$('#cancelBankConnection').addEventListener('click',()=>resetBankConnectionFlow({focus:true}));
$('#bankConnectionBack').addEventListener('click',()=>setBankConnectionStep('institution',{focus:true}));
$('#bankConnectForm').addEventListener('change',event=>{if(event.target.matches('input[name="bankAccount"]')&&event.target.checked)setBankAccountSelectionError(false);});
$('#bankConnectForm').addEventListener('submit',event=>{event.preventDefault();runAsyncAction(connectSelectedBankAccounts);});
$('#connectedBanksModal').addEventListener('close',()=>{hideBankActionTooltip();resetBankConnectionFlow();});
$('#confirmBankUnlink').addEventListener('click',confirmBankUnlink);
$('#unlinkBankModal').addEventListener('close',()=>{pendingBankUnlinkId=null;});
$('#headerBankButton').addEventListener('click',openBankSettings);
$('#syncNow').addEventListener('click',()=>{closeCardMenus();runAsyncAction(()=>syncActiveBankConnections());});
$('#reviewUncategorizedTransactions').addEventListener('click',()=>{activityReviewOnly=true;activityPage=1;showView('activity');renderActivity();});
const resolveAlertFromButton=(button,options={})=>resolveNotification({key:button.dataset.notificationKey,fingerprint:button.dataset.notificationFingerprint},options);
$('#resolveUncategorized').addEventListener('click',event=>{event.stopPropagation();resolveAlertFromButton(event.currentTarget);});
$('#resolveBudgetRecovery').addEventListener('click',event=>resolveAlertFromButton(event.currentTarget));
$('#resolveReviewQueue').addEventListener('click',event=>{activityReviewOnly=false;resolveAlertFromButton(event.currentTarget);});
$('#clearReviewFilter').addEventListener('click',()=>{activityReviewOnly=false;activityPage=1;renderActivity();});
$('#addCategory').addEventListener('click',()=>{returnToBudgetManager=false;openBudgetEditor();});
$('#manageBudgetCategories')?.addEventListener('click',()=>openBudgetCategoryManager({reset:true}));
$('#openBudgetTransfer').addEventListener('click',openBudgetTransfer);
$('#autoBalanceBudget').addEventListener('click',()=>{if(!window.confirm(t('balancePlanConfirm')))return;const result=MerCore.trimBudgetAllocation(state.categories,getPlan().monthlyBudget);if(!result.valid)return;save('budget-auto-balance');showToast(t(result.resolved?'balancePlanReady':'balancePlanPartial',{amount:currency(result.reduced),remaining:currency(result.remaining)}));});
$('#budgetTransferTarget').addEventListener('change',refreshBudgetTransferForm);
$('#budgetTransferSource').addEventListener('change',refreshBudgetTransferForm);
$('#budgetTransferForm').addEventListener('submit',event=>{event.preventDefault();const result=MerCore.transferBudgetAllocation(state.categories,$('#budgetTransferSource').value,$('#budgetTransferTarget').value,Number($('#budgetTransferAmount').value));if(!result.valid){showToast(t('transferInvalid'));refreshBudgetTransferForm();return;}save('budget-cover-overspending');closeModal($('#budgetTransferModal'));showToast(t('transferSaved',{amount:currency(result.amount)}));});
$('#budgetCategoryManagerAdd').addEventListener('click',()=>{returnToBudgetManager=true;openBudgetEditor();});
$('#budgetCategorySearch').addEventListener('input',renderBudgetCategoryManager);
$('#budgetCategoryStatusFilter').addEventListener('change',renderBudgetCategoryManager);
const handleBudgetEdit=event=>{const button=event.target.closest('[data-edit-budget]');if(!button)return;returnToBudgetManager=Boolean(button.closest('#budgetCategoriesModal'));openBudgetEditor(button.dataset.editBudget);};
$('#budgetTable').addEventListener('click',handleBudgetEdit);
$('#budgetCategoryModalList').addEventListener('click',handleBudgetEdit);
$('#addRecurring').addEventListener('click',()=>openRecurring());
$('#addIncomeCategory').addEventListener('click',()=>openIncomeCategoryEditor());
$('#themeToggle').addEventListener('click',event=>{const choice=event.target.closest('[data-theme-choice]');if(choice)setTheme(choice.dataset.themeChoice);});$$('[data-account]').forEach(button=>button.addEventListener('click',()=>switchAccount(button.dataset.account)));
$('#notificationButton').addEventListener('click',event=>{event.stopPropagation();toggleNotifications();});$('#closeNotifications').addEventListener('click',()=>closeNotifications(true));
$$('[data-tooltip-key]').forEach(trigger=>{trigger.addEventListener('mouseenter',()=>showTooltip(trigger));trigger.addEventListener('mouseleave',hideTooltip);trigger.addEventListener('focus',()=>showTooltip(trigger));trigger.addEventListener('blur',hideTooltip);trigger.addEventListener('click',()=>$('#appTooltip').hidden?showTooltip(trigger):hideTooltip());});
window.addEventListener('scroll',hideTooltip,{capture:true,passive:true});
window.addEventListener('scroll',()=>hideBankActionTooltip(),{capture:true,passive:true});
$$('[data-insight-detail]').forEach(card=>{
  card.addEventListener('click',event=>{if(event.target.closest('button,a'))return;openInsightDetail(card.dataset.insightDetail);});
  card.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&!event.target.closest('button,a')){event.preventDefault();openInsightDetail(card.dataset.insightDetail);}});
});
$$('[data-card-menu]').forEach(trigger=>trigger.addEventListener('click',()=>{const menuId=trigger.dataset.cardMenu;closeCardMenus(trigger.getAttribute('aria-expanded')==='true'?null:menuId);}));
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-detail-route]');
  if(!button)return;
  event.preventDefault();
  const target=button.dataset.detailRoute;
  if(button.hasAttribute('data-clear-activity-filters'))resetActivityFilters({render:false});
  showView(target);
  if(target==='activity')renderActivity();
});
document.addEventListener('click',event=>{if(!event.target.closest('.sidebar-bottom'))toggleAccountMenu(false);if(!event.target.closest('.notification-wrap'))closeNotifications();if(!event.target.closest('.card-action-wrap'))closeCardMenus();if(!event.target.closest('.activity-toolbar'))setActivityFiltersOpen(false);});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const modal=$$('.modal[open]').at(-1);if(modal){event.preventDefault();closeModal(modal);return;}if(!$('#activityFiltersPanel').hidden){event.preventDefault();setActivityFiltersOpen(false);$('#activityFiltersToggle').focus({preventScroll:true});return;}if(!$('#notificationCenter').hidden){event.preventDefault();closeNotifications(true);return;}if(!$('#accountMenu').hidden){event.preventDefault();toggleAccountMenu(false);$('#openSettings').focus({preventScroll:true});return;}closeCardMenus();});
$$('.nav-item').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
$$('[data-go-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.goView)));
$('[data-home]').addEventListener('click',event=>{event.preventDefault();showView('overview');});
$$('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
$('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.contains('open')?closeSidebar():openSidebar()); $('#sidebarScrim').addEventListener('click',closeSidebar);

$('#transactionAmount').addEventListener('input',evaluateTransaction); $('#transactionDate').addEventListener('input',evaluateTransaction); $('#transactionCategory').addEventListener('change',evaluateTransaction);
$$('[data-transaction-type]').forEach(button=>button.addEventListener('click',()=>setTransactionType(button.dataset.transactionType)));
$('#transactionForm').addEventListener('submit',event=>{
  event.preventDefault();
  const selectedType=$('[data-transaction-type][aria-pressed="true"]')?.dataset.transactionType;
  transactionType=selectedType==='income'?'income':'expense';
  const amount=Number($('#transactionAmount').value),name=$('#transactionName').value.trim(),dateValue=String($('#transactionDate').value||'').slice(0,10);
  if(!name||!Number.isFinite(amount)||amount<=0||!validStoredDate(dateValue)||!evaluateTransaction()){showToast(t(validStoredDate(dateValue)?'positiveAmountRequired':'transactionDateRequired'));return;}
  const warning=$('#spendCheck').dataset.budgetWarning||'',monthlyOver=Number($('#spendCheck').dataset.monthlyOver)||0,categoryOver=Number($('#spendCheck').dataset.categoryOver)||0,overage=warning==='monthly-over'?monthlyOver:categoryOver,category=$('#transactionCategory').value,existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;
  if(existing)MerAccounting.undoRoundUp(state,existing);
  const payload={type:transactionType,name,amount,category,date:`${dateValue}T12:00:00`,timestamp:`${dateValue}T12:00:00`};
  let savedTransaction;
  if(existing){
    Object.assign(existing,payload);
    MerCore.updateTransactionSchedule(existing,appReferenceDate);
    if(existing.sourceType==='auto'){existing.needsReview=false;existing.categoryConfidence='manual';}
    MerAccounting.applyRoundUp(state,existing,appReferenceDate);
    savedTransaction=existing;
  }else{
    const created=MerCore.updateTransactionSchedule({id:uniqueId('transaction'),...payload,source:'Manual',sourceType:'manual',needsReview:false,merchantName:payload.name,currency:appState.settings.currency},appReferenceDate);
    state.transactions.unshift(created);MerAccounting.applyRoundUp(state,created,appReferenceDate);savedTransaction=created;
  }
  save(existing?'transaction-edit':'transaction-add');closeModal($('#transactionModal'));
  const successMessage=savedTransaction.status==='scheduled'?t('scheduledTransactionSaved',{date:formatIsoDate(dateValue)}):transactionType==='expense'&&(warning==='monthly-over'||warning==='category-over')?t('transactionAddedOverBudget',{amount:currency(overage)}):existing?.sourceType==='auto'?t('categoryApproved'):t(transactionType==='income'?(existing?'incomeUpdated':'incomeAdded'):(existing?'expenseUpdated':'transactionAdded'));
  showToast(successMessage);editingTransactionId=null;
});
$('#deleteTransaction').addEventListener('click',()=>{const existing=state.transactions.find(tx=>String(tx.id)===String(editingTransactionId));if(!existing)return;const type=MerCore.transactionType(existing);MerAccounting.undoRoundUp(state,existing);state.transactions=state.transactions.filter(tx=>String(tx.id)!==String(editingTransactionId));save('transaction-delete');closeModal($('#transactionModal'));showToast(t(type==='income'?'incomeDeleted':'expenseDeleted'));editingTransactionId=null;});

$('#assessmentNext').addEventListener('click',()=>{const active=$(`.assessment-step[data-step="${assessmentStep}"]`);const inputs=$$('input[required]',active);if(!inputs.every(input=>input.reportValidity()))return;setAssessmentStep(Math.min(3,assessmentStep+1));});
$('#assessmentBack').addEventListener('click',()=>setAssessmentStep(Math.max(1,assessmentStep-1)));
$$('#assessmentForm input').forEach(input=>['input','change'].forEach(eventName=>input.addEventListener(eventName,()=>{if(assessmentStep===3)updateRecommendation();})));
$('#assessmentForm').addEventListener('submit',applyAssessmentPlan);

$('#budgetForm').addEventListener('submit',event=>{event.preventDefault();const cat=editingCategoryId?state.categories.find(item=>item.id===editingCategoryId):null,name=$('#categoryNameInput').value.trim(),value=Number($('#budgetLimitInput').value),plan=getPlan(),otherAllocated=state.categories.reduce((sum,item)=>sum+item.limit,0)-(cat?.limit||0),validation=MerCore.validateCategoryLimit(value,cat?.spent||0,otherAllocated,plan.monthlyBudget);if(!name){showToast(t('categoryNameRequired'));return;}if(state.categories.some(item=>item.id!==editingCategoryId&&categoryName(item.id).toLocaleLowerCase(locale())===name.toLocaleLowerCase(locale()))){showToast(t('duplicateCategory'));return;}if(!validation.valid){showToast(t(validation.reason==='below-spent'?'limitTooLow':'allocationTooHigh'));return;}if(cat){if(cat.isCustom){cat.name=name;cat.icon=$('#categoryIconInput').value.trim().slice(0,2)||name.slice(0,1).toUpperCase();}cat.limit=value;}else{state.categories.push({id:uniqueId('custom-category'),name,icon:$('#categoryIconInput').value.trim().slice(0,2)||name.slice(0,1).toUpperCase(),spent:0,limit:value,isCustom:true});}save(cat?'category-edit':'category-add');closeModal($('#budgetModal'));showToast(t(cat?'categoryUpdated':'categoryCreated'));if(returnToBudgetManager){returnToBudgetManager=false;openBudgetCategoryManager();}});
$('#deleteCategory').addEventListener('click',()=>{const cat=state.categories.find(item=>item.id===editingCategoryId);if(!cat?.isCustom)return;const fallback=fallbackCategory(cat.id);fallback.spent+=cat.spent;fallback.limit+=cat.limit;state.transactions.forEach(tx=>{if(tx.category===cat.id)tx.category=fallback.id;});(state.recurring||[]).forEach(rule=>{if(rule.category===cat.id)rule.category=fallback.id;});state.categories=state.categories.filter(item=>item.id!==cat.id);save('category-delete');closeModal($('#budgetModal'));showToast(t('categoryDeleted'));editingCategoryId=null;if(returnToBudgetManager){returnToBudgetManager=false;openBudgetCategoryManager();}});

$('#savingsAmountInput').addEventListener('input',updateSavingsCheck);
$('#savingsForm').addEventListener('submit',event=>{event.preventDefault();if(!updateSavingsCheck())return;const amount=Number($('#savingsAmountInput').value),note=$('#savingsNoteInput').value.trim(),goalId=$('#savingsGoalInput').value,existing=editingSavingsId!==null?(state.savingsEntries||[]).find(entry=>String(entry.id)===String(editingSavingsId)):null;if(existing){MerCore.applySavingsContribution(state,existing.goalId,existing.amount,-1);MerCore.applySavingsContribution(state,goalId,amount,1);const historyIndex=savingsHistoryIndexFor(existing.date);if(historyIndex!==null)state.savingsHistory[historyIndex]=Math.max(0,state.savingsHistory[historyIndex]-existing.amount+amount);existing.amount=amount;existing.note=note;existing.goalId=goalId;}else{const applied=MerCore.applySavingsContribution(state,goalId,amount,1);if(!applied.valid){showToast(t('goalInvalid'));return;}state.savingsEntries=state.savingsEntries||[];state.savingsEntries.push({id:uniqueId('saving'),amount,note,goalId,date:`${appReferenceDate}T12:00:00`});state.savingsHistory[state.savingsHistory.length-1]+=amount;}save(existing?'savings-edit':'savings-add');closeModal($('#savingsModal'));showToast(t(existing?'savingsUpdated':'depositAdded',{amount:currency(amount,true)}));editingSavingsId=null;});
$('#deleteSavingsEntry').addEventListener('click',()=>{const existing=(state.savingsEntries||[]).find(entry=>String(entry.id)===String(editingSavingsId));if(!existing)return;MerCore.applySavingsContribution(state,existing.goalId,existing.amount,-1);const historyIndex=savingsHistoryIndexFor(existing.date);if(historyIndex!==null)state.savingsHistory[historyIndex]=Math.max(0,state.savingsHistory[historyIndex]-existing.amount);state.savingsEntries=state.savingsEntries.filter(entry=>String(entry.id)!==String(editingSavingsId));save('savings-delete');closeModal($('#savingsModal'));showToast(t('savingsDeleted'));editingSavingsId=null;});

$('#recurringDayInput').addEventListener('input',updateRecurringPreview);$('#recurringStartInput').addEventListener('input',updateRecurringPreview);
$('#recurringForm').addEventListener('submit',event=>{event.preventDefault();if(!updateRecurringPreview())return;const payload={name:$('#recurringNameInput').value.trim(),amount:Number($('#recurringAmountInput').value),category:$('#recurringCategoryInput').value,day:Number($('#recurringDayInput').value),startDate:$('#recurringStartInput').value,enabled:true};if(!payload.name||!Number.isFinite(payload.amount)||payload.amount<=0||payload.day<1||payload.day>31){showToast(t('recurringInvalidDay'));return;}const existing=editingRecurringId!==null?(state.recurring||[]).find(rule=>String(rule.id)===String(editingRecurringId)):null;if(existing)Object.assign(existing,payload);else{state.recurring=state.recurring||[];state.recurring.push({id:uniqueId('recurring'),...payload,lastProcessed:null});}save(existing?'recurring-edit':'recurring-add');closeModal($('#recurringModal'));showToast(t('recurringSaved'));editingRecurringId=null;});
$('#deleteRecurring').addEventListener('click',()=>{state.recurring=(state.recurring||[]).filter(rule=>String(rule.id)!==String(editingRecurringId));save('recurring-delete');closeModal($('#recurringModal'));showToast(t('recurringDeleted'));editingRecurringId=null;});

$('#incomeCategoryForm').addEventListener('submit',event=>{event.preventDefault();const existing=editingIncomeCategoryId?state.incomeCategories.find(item=>item.id===editingIncomeCategoryId):null;const name=$('#incomeCategoryNameInput').value.trim();if(!name){showToast(t('categoryNameRequired'));return;}if(state.incomeCategories.some(item=>item.id!==editingIncomeCategoryId&&incomeCategoryName(item.id).toLocaleLowerCase(locale())===name.toLocaleLowerCase(locale()))){showToast(t('duplicateCategory'));return;}const icon=$('#incomeCategoryIconInput').value.trim().slice(0,2)||name.slice(0,1).toUpperCase();if(existing){existing.name=name;existing.icon=icon;}else state.incomeCategories.push({id:uniqueId('income-category'),name,icon,isCustom:true});save(existing?'income-category-edit':'income-category-add');closeModal($('#incomeCategoryModal'));showToast(t(existing?'incomeCategoryUpdated':'incomeCategoryCreated'));editingIncomeCategoryId=null;});
$('#deleteIncomeCategory').addEventListener('click',()=>{const existing=state.incomeCategories.find(item=>item.id===editingIncomeCategoryId);if(!existing?.isCustom)return;let fallback=state.incomeCategories.find(item=>item.id==='otherIncome');if(!fallback){fallback=structuredClone(defaultIncomeCategories.find(item=>item.id==='otherIncome'));state.incomeCategories.push(fallback);}state.transactions.forEach(tx=>{if(MerCore.transactionType(tx)==='income'&&tx.category===existing.id)tx.category=fallback.id;});state.incomeCategories=state.incomeCategories.filter(item=>item.id!==existing.id);save('income-category-delete');closeModal($('#incomeCategoryModal'));showToast(t('incomeCategoryDeleted'));editingIncomeCategoryId=null;});

function setActivityFiltersOpen(open) {
  const panel=$('#activityFiltersPanel'),toggle=$('#activityFiltersToggle');
  panel.hidden=!open;
  toggle.setAttribute('aria-expanded',String(open));
}

function renderActivityFromFirstPage(){activityPage=1;renderActivity();}
$('#activitySearch').addEventListener('input',renderActivityFromFirstPage);
$('#activityFiltersToggle').addEventListener('click',()=>setActivityFiltersOpen($('#activityFiltersPanel').hidden));
['activityFilter','activityTypeFilter','activityDateFrom','activityDateTo','activitySort'].forEach(id=>$('#'+id).addEventListener('change',renderActivityFromFirstPage));
$$('[data-activity-view-mode]').forEach(button=>button.addEventListener('click',()=>{activityViewMode=button.dataset.activityViewMode==='continuous'?'continuous':'pages';activityPage=1;renderActivity();$('#transactionList').scrollTop=0;}));
$('#activityPreviousPage').addEventListener('click',()=>{if(activityPage<=1)return;activityPage-=1;renderActivity();$('#transactionList').scrollTop=0;});
$('#activityNextPage').addEventListener('click',()=>{activityPage+=1;renderActivity();$('#transactionList').scrollTop=0;});
function resetActivityFilters({render=true}={}) {
  $('#activitySearch').value='';
  $('#activityFilter').value='all';
  $('#activityTypeFilter').value='all';
  $('#activityDateFrom').value='';
  $('#activityDateTo').value='';
  $('#activitySort').value='date-desc';
  activityReviewOnly=false;
  activityPage=1;
  setActivityFiltersOpen(false);
  if(render)renderActivity();
}
$('#clearActivityFilters').addEventListener('click',()=>resetActivityFilters());
$$('#insightsFilters [data-timeframe]').forEach(button=>button.addEventListener('click',()=>{insightsTimeframe=button.dataset.timeframe;renderInsights();}));
setInterval(()=>{renderSystemDate(new Date());renderBankSyncStatus();},60000);
window.addEventListener('resize',()=>{if(window.innerWidth>=768)closeSidebar();renderSystemDate(new Date());});

function syncBanksIfStale(){const stale=bankConnectionsFor().some(connection=>{const syncedAt=Date.parse(connection.lastSyncedAt);return !Number.isFinite(syncedAt)||Date.now()-syncedAt>=300000;});if(stale)return runAsyncAction(()=>syncActiveBankConnections({silent:true}));return Promise.resolve({skipped:'fresh'});}

processDueRecurring(state);applyStaticTranslations();applyTheme();reactiveUiReady=true;save('app-initialization');showView(activeView);
setTimeout(()=>runAsyncAction(syncBanksIfStale),1200);setInterval(()=>syncActiveBankConnections({silent:true}),300000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')runAsyncAction(syncBanksIfStale);});

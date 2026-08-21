const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const translations = {
  hr: {
    skip:'Preskoči na sadržaj', primaryNav:'Glavna navigacija', productName:'Moj novac', navOverview:'Pregled', navBudgets:'Budžeti', navSavings:'Štednja', navActivity:'Aktivnost', weeklyCheck:'TJEDNI PREGLED', onTrackSave:'Na dobrom ste putu da ovaj mjesec uštedite', viewPlan:'Pogledaj plan', personalAccount:'Osobni račun', openNav:'Otvori navigaciju', closeNav:'Zatvori navigaciju', budgetMonth:'Mjesec budžeta', previousMonth:'Prethodni mjesec', nextMonth:'Sljedeći mjesec', language:'Jezik', notifications:'Obavijesti', addTransaction:'Dodaj transakciju', greeting:'Dobro jutro, Alex.', overviewSubtitle:'Evo kako danas stoje vaše financije.', adjustPlan:'Prilagodi plan', financialSummary:'Financijski sažetak', availableBalance:'Raspoloživo stanje', balanceInfo:'Informacije o stanju', fromLastMonth:'od prošlog mjeseca', spentMonth:'Potrošeno ovaj mjesec', budgetUsage:'Iskorištenost mjesečnog budžeta', savedMonth:'Ušteđeno ovaj mjesec', aheadPlan:'ispred plana', spendingGuardrail:'ZAŠTITA BUDŽETA', safeToSpend:'Sigurno za potrošiti', safeInfo:'Informacije o sigurnom iznosu', perDay:'na dan', canSpendUpTo:'Možete potrošiti još', withinBudget:'Unutar ste budžeta', overBudget:'Budžet je prekoračen', seeCalculation:'Pogledaj izračun', budgetTracker:'Praćenje budžeta', viewAll:'Prikaži sve', cashFlow:'NOVČANI TOK', spendingPace:'Tempo potrošnje', legend:'Legenda', actual:'Stvarno', planned:'Planirano', spentSoFar:'potrošeno dosad', lessThanPlanned:'206 € manje od plana', today:'Danas', topSavingsGoal:'GLAVNI CILJ ŠTEDNJE', emergencyFund:'Fond za hitne slučajeve', openSavings:'Otvori štednju', savingsProgress:'Napredak cilja štednje', monthlyDeposit:'Mjesečna uplata', estimatedFinish:'Procijenjeni završetak', addToSavings:'Dodaj u štednju', nextSevenDays:'SLJEDEĆIH 7 DANA', upcoming:'Nadolazeće', seeActivity:'Pogledaj aktivnost', monthlyPlan:'MJESEČNI PLAN', budgetsTitle:'Budžeti', budgetsSubtitle:'Postavite granice po kategorijama i zadržite kontrolu nad potrošnjom.', budgetSummary:'Sažetak budžeta', monthlyBudget:'Mjesečni budžet', afterCommitments:'Nakon obveza, štednje i rezerve', remainingBudget:'Preostali budžet', protectedCommitments:'Sve obveze su zaštićene', allocatedCategories:'Raspoređeno po kategorijama', categoryLimits:'OGRANIČENJA KATEGORIJA', monthlySpendingPlan:'Mjesečni plan potrošnje', changeTotalBudget:'Promijeni ukupni budžet', yourFuture:'VAŠA BUDUĆNOST', savingsTitle:'Štednja', savingsSubtitle:'Gradite sigurnosnu mrežu bez ugrožavanja svakodnevnog budžeta.', newDeposit:'Nova uplata', activeGoal:'AKTIVNI CILJ', onTrack:'Prema planu', stillNeeded:'Još je potrebno', merRecommendation:'MER PREPORUKA', healthyReserve:'Zdrava sigurnosna rezerva', reserveRecommendation:'Vaša trenutačna rezerva već pokriva nekoliko mjeseci osnovnih troškova. Nastavite redovito uplaćivati kako biste izgradili još veću sigurnost.', essentialsCoverage:'Pokrivenost osnovnih troškova', reviewStrategy:'Pregledaj strategiju', thisYear:'OVA GODINA', savingsHistory:'Povijest štednje', monthlySavingsChart:'Mjesečne uplate u štednju', moneyMovement:'KRETANJE NOVCA', activityTitle:'Aktivnost', activitySubtitle:'Pregledajte prihode i troškove te brzo pronađite svaku transakciju.', searchTransactions:'Pretraži transakcije', filterCategory:'Filtriraj po kategoriji', allCategories:'Sve kategorije', nothingFound:'Nema rezultata', tryOtherSearch:'Pokušajte s drugim pojmom ili kategorijom.', close:'Zatvori', recordSpending:'ZABILJEŽI POTROŠNJU', transactionIntro:'Prije dodavanja provjerit ćemo kupnju prema ukupnom i kategorijskom budžetu.', merchantDescription:'Trgovac ili opis', merchantPlaceholder:'npr. Tržnica Dolac', amount:'Iznos', category:'Kategorija', guardReady:'Zaštita budžeta je spremna', enterImpact:'Unesite iznos za provjeru utjecaja.', checkAddTransaction:'Provjeri i dodaj transakciju', assessmentProgress:'Napredak procjene', step:'KORAK', shapePlan:'Oblikujmo vaš mjesečni plan.', incomeCommitments:'Počnite s prihodima i obveznim troškovima.', monthlyIncome:'Mjesečni neto prihod', essentialBills:'Osnovni računi i obveze', savingToward:'Prema čemu štedite?', targetProtected:'Realističan cilj bit će zaštićen prije svakodnevne potrošnje.', monthlySavingsTarget:'Mjesečni cilj štednje', currentSavings:'Trenutačno stanje štednje', chooseGuardrail:'Odaberite sigurnosnu rezervu.', breathingRoom:'Koliki dio prihoda želite ostaviti netaknutim?', comfortable:'Komotno', buffer15:'Sačuvaj 15% kao rezervu', balanced:'Uravnoteženo', buffer10:'Sačuvaj 10% kao rezervu', flexible:'Fleksibilno', buffer5:'Sačuvaj 5% kao rezervu', recommendedBudget:'Preporučeni budžet za potrošnju', back:'Natrag', continue:'Nastavi', usePlan:'Primijeni plan', calculationTitle:'Kako smo izračunali siguran iznos', essentialBillsShort:'Osnovne obveze', safetyBuffer:'Sigurnosna rezerva', flexibleMonthlyBudget:'Fleksibilni mjesečni budžet', alreadySpent:'Već potrošeno', safeRemainder:'Sigurno preostaje', commitmentsProtected:'Obvezni troškovi i cilj štednje ostaju zaštićeni pri svakoj novoj transakciji.', categoryBudget:'BUDŽET KATEGORIJE', setRealisticLimit:'Postavite realističnu granicu. Novi iznos ne može biti manji od već potrošenog.', monthlyLimit:'Mjesečni limit', saveLimit:'Spremi ograničenje', savingsDeposit:'UPLATA U ŠTEDNJU', addToEmergencyFund:'Dodaj u fond za hitne slučajeve', depositIntro:'Uplata će smanjiti raspoloživo stanje, ali neće se računati kao potrošnja.', depositAmount:'Iznos uplate', confirmDeposit:'Potvrdi uplatu', food:'Hrana i restorani', transport:'Prijevoz', shopping:'Kupovina', entertainment:'Zabava', other:'Ostalo', usedOf:'{spent} od {limit}', budgetOf:'{percent}% od {budget} budžeta', untilEndMonth:'do kraja {month}', daysRemaining:'Preostalo je {days} dana', goalOf:'od {target}', goalTargetOf:'od ciljanih {target}', months:'{value} mjeseci', allocated:'{amount} još nije raspoređeno', overAllocated:'Raspored prelazi budžet za {amount}', allocationPercent:'{percent}% raspoređeno', allocationCopy:'Kategorije pokrivaju {allocated} od {budget} dostupnog budžeta.', spentCategory:'Potrošeno: {spent}. Najviše dostupno: {max}.', transactionSafe:'{amount} ostaje sigurno', transactionSafeNote:'Ukupni i kategorijski budžet ostaju unutar granica.', transactionTotalBlocked:'Ova kupnja prelazi ukupni budžet', reduceBy:'Smanjite iznos za {amount} ili prilagodite plan.', transactionCategoryBlocked:'Ova kupnja prelazi budžet kategorije', categoryOnlyLeft:'U kategoriji {category} preostaje {amount}.', transactionWarning:'Blizu ste ograničenja kategorije', categoryAfter:'Nakon kupnje u kategoriji ostaje {amount}.', transactionAdded:'Transakcija je dodana i budžet je ažuriran.', transactionBlocked:'Transakcija je zaustavljena radi zaštite budžeta.', planReady:'Vaš novi plan je spreman.', planInvalid:'Plan mora ostaviti dovoljno sredstava za dosadašnju potrošnju.', limitSaved:'Ograničenje kategorije je spremljeno.', limitTooLow:'Limit ne može biti manji od već potrošenog.', allocationTooHigh:'Ukupna ograničenja ne mogu biti veća od mjesečnog budžeta.', depositSafe:'Nakon uplate na računu ostaje {amount}', billsRemain:'Osnovne obveze ostaju pokrivene.', depositBlocked:'Ovaj iznos zadire u novac za obveze', depositMax:'Za dodatnu štednju dostupno je najviše {amount}.', depositAdded:'{amount} dodano je u fond za hitne slučajeve.', viewingMonth:'Prikazan je {month}. Podaci ostaju u demonstracijskom načinu.', todayDate:'ČETVRTAK, 20. KOLOVOZA', dueTomorrow:'Sutra', dueDate:'{day}. kol', utilities:'Režije', emptyActivity:'Još nema transakcija.', dateToday:'Danas', dateYesterday:'Jučer', planPerMonth:'{amount} / mjesec', saveChanges:'Promjene su spremljene', historyUnavailable:'Povijesni podaci prikazuju demonstracijski prikaz.'
  },
  en: {
    skip:'Skip to content', primaryNav:'Primary navigation', productName:'My money', navOverview:'Overview', navBudgets:'Budgets', navSavings:'Savings', navActivity:'Activity', weeklyCheck:'WEEKLY CHECK-IN', onTrackSave:'You are on track to save', viewPlan:'View my plan', personalAccount:'Personal account', openNav:'Open navigation', closeNav:'Close navigation', budgetMonth:'Budget month', previousMonth:'Previous month', nextMonth:'Next month', language:'Language', notifications:'Notifications', addTransaction:'Add transaction', greeting:'Good morning, Alex.', overviewSubtitle:'Here is how your money looks today.', adjustPlan:'Adjust my plan', financialSummary:'Financial summary', availableBalance:'Available balance', balanceInfo:'Balance information', fromLastMonth:'from last month', spentMonth:'Spent this month', budgetUsage:'Monthly budget usage', savedMonth:'Saved this month', aheadPlan:'ahead of plan', spendingGuardrail:'SPENDING GUARDRAIL', safeToSpend:'Safe to spend', safeInfo:'Safe-to-spend information', perDay:'per day', canSpendUpTo:'You can still spend', withinBudget:'You are within budget', overBudget:'Budget exceeded', seeCalculation:'See calculation', budgetTracker:'Budget tracker', viewAll:'View all', cashFlow:'CASH FLOW', spendingPace:'Spending pace', legend:'Legend', actual:'Actual', planned:'Planned', spentSoFar:'spent so far', lessThanPlanned:'€206 less than planned', today:'Today', topSavingsGoal:'TOP SAVINGS GOAL', emergencyFund:'Emergency fund', openSavings:'Open savings', savingsProgress:'Savings goal progress', monthlyDeposit:'Monthly deposit', estimatedFinish:'Estimated finish', addToSavings:'Add to savings', nextSevenDays:'NEXT 7 DAYS', upcoming:'Upcoming', seeActivity:'See activity', monthlyPlan:'MONTHLY PLAN', budgetsTitle:'Budgets', budgetsSubtitle:'Set category limits and stay in control of your spending.', budgetSummary:'Budget summary', monthlyBudget:'Monthly budget', afterCommitments:'After bills, savings and buffer', remainingBudget:'Remaining budget', protectedCommitments:'All commitments are protected', allocatedCategories:'Allocated to categories', categoryLimits:'CATEGORY LIMITS', monthlySpendingPlan:'Monthly spending plan', changeTotalBudget:'Change total budget', yourFuture:'YOUR FUTURE', savingsTitle:'Savings', savingsSubtitle:'Build a safety net without compromising your everyday budget.', newDeposit:'New deposit', activeGoal:'ACTIVE GOAL', onTrack:'On track', stillNeeded:'Still needed', merRecommendation:'MER RECOMMENDATION', healthyReserve:'A healthy safety reserve', reserveRecommendation:'Your current reserve already covers several months of essential expenses. Keep making regular deposits to build even more security.', essentialsCoverage:'Essential expense coverage', reviewStrategy:'Review strategy', thisYear:'THIS YEAR', savingsHistory:'Savings history', monthlySavingsChart:'Monthly savings contributions', moneyMovement:'MONEY MOVEMENT', activityTitle:'Activity', activitySubtitle:'Review income and expenses and quickly find any transaction.', searchTransactions:'Search transactions', filterCategory:'Filter by category', allCategories:'All categories', nothingFound:'Nothing found', tryOtherSearch:'Try another search or category.', close:'Close', recordSpending:'RECORD SPENDING', transactionIntro:'We will check this purchase against both your total and category budgets before adding it.', merchantDescription:'Merchant or description', merchantPlaceholder:'e.g. Corner Market', amount:'Amount', category:'Category', guardReady:'Your budget guardrail is ready', enterImpact:'Enter an amount to see its impact.', checkAddTransaction:'Check and add transaction', assessmentProgress:'Assessment progress', step:'STEP', shapePlan:'Let’s shape your monthly plan.', incomeCommitments:'Start with what comes in and what must go out.', monthlyIncome:'Monthly take-home income', essentialBills:'Essential bills and commitments', savingToward:'What are you saving toward?', targetProtected:'A realistic target will be protected before everyday spending.', monthlySavingsTarget:'Monthly savings target', currentSavings:'Current savings balance', chooseGuardrail:'Choose your safety buffer.', breathingRoom:'How much of your income should remain untouched?', comfortable:'Comfortable', buffer15:'Keep 15% as a buffer', balanced:'Balanced', buffer10:'Keep 10% as a buffer', flexible:'Flexible', buffer5:'Keep 5% as a buffer', recommendedBudget:'Recommended spending budget', back:'Back', continue:'Continue', usePlan:'Use this plan', calculationTitle:'How we calculated your safe amount', essentialBillsShort:'Essential commitments', safetyBuffer:'Safety buffer', flexibleMonthlyBudget:'Flexible monthly budget', alreadySpent:'Already spent', safeRemainder:'Safe remainder', commitmentsProtected:'Essential expenses and your savings goal remain protected with every new transaction.', categoryBudget:'CATEGORY BUDGET', setRealisticLimit:'Set a realistic limit. The new amount cannot be lower than what you have already spent.', monthlyLimit:'Monthly limit', saveLimit:'Save limit', savingsDeposit:'SAVINGS DEPOSIT', addToEmergencyFund:'Add to emergency fund', depositIntro:'The deposit will reduce your available balance but will not count as spending.', depositAmount:'Deposit amount', confirmDeposit:'Confirm deposit', food:'Food and dining', transport:'Transport', shopping:'Shopping', entertainment:'Entertainment', other:'Other', usedOf:'{spent} of {limit}', budgetOf:'{percent}% of {budget} budget', untilEndMonth:'until the end of {month}', daysRemaining:'{days} days remaining', goalOf:'of {target}', goalTargetOf:'of {target} target', months:'{value} months', allocated:'{amount} is still unallocated', overAllocated:'Allocation is {amount} over budget', allocationPercent:'{percent}% allocated', allocationCopy:'Categories cover {allocated} of the {budget} available budget.', spentCategory:'Spent: {spent}. Maximum available: {max}.', transactionSafe:'{amount} stays safe', transactionSafeNote:'Both total and category budgets remain within their limits.', transactionTotalBlocked:'This purchase exceeds your total budget', reduceBy:'Reduce it by {amount} or adjust your plan.', transactionCategoryBlocked:'This purchase exceeds the category budget', categoryOnlyLeft:'Only {amount} remains in {category}.', transactionWarning:'You are close to the category limit', categoryAfter:'After this purchase, {amount} remains in the category.', transactionAdded:'Transaction added and budget updated.', transactionBlocked:'Transaction blocked to protect your budget.', planReady:'Your new plan is ready.', planInvalid:'The plan must leave enough room for spending already recorded.', limitSaved:'Category limit saved.', limitTooLow:'The limit cannot be lower than the amount already spent.', allocationTooHigh:'Total category limits cannot exceed the monthly budget.', depositSafe:'{amount} will remain in your account', billsRemain:'Essential commitments remain covered.', depositBlocked:'This amount uses money reserved for commitments', depositMax:'At most {amount} is available for extra savings.', depositAdded:'{amount} added to your emergency fund.', viewingMonth:'Showing {month}. Values remain in demo mode.', todayDate:'THURSDAY, 20 AUGUST', dueTomorrow:'Tomorrow', dueDate:'{day} Aug', utilities:'Utilities', emptyActivity:'No transactions yet.', dateToday:'Today', dateYesterday:'Yesterday', planPerMonth:'{amount} / month', saveChanges:'Changes saved', historyUnavailable:'Historical values use the demonstration view.'
  }
};

Object.assign(translations.hr, {
  businessAccount:'Poslovni račun', darkMode:'Tamni način', lightMode:'Svijetli način', switchAccount:'PROMIJENI RAČUN', settings:'POSTAVKE', exportCsv:'Izvezi mjesečni CSV', notificationCenter:'Centar obavijesti',
  balanceTooltip:'Iznos dostupan na aktivnom računu nakon evidentiranih transakcija i uplata u štednju.', safeTooltip:'Iznos koji možete potrošiti bez zadiranja u račune, cilj štednje i sigurnosnu rezervu.',
  newCategory:'Nova kategorija', recurringExpenses:'PONAVLJAJUĆI TROŠKOVI', scheduledPayments:'Zakazana plaćanja', newRecurring:'Novi trošak', totalSavedPeriod:'Ukupno ušteđeno u prikazanom razdoblju', savingsEntries:'UPLATE U ŠTEDNJU', recentSavingsEntries:'Nedavne uplate',
  deleteExpense:'Izbriši trošak', editExpense:'Uredi transakciju', updateExpense:'Spremi promjene', categoryName:'Naziv kategorije', categoryIcon:'Oznaka', deleteCategory:'Izbriši kategoriju', saveCategory:'Spremi kategoriju', savingsNote:'Opis uplate', deleteEntry:'Izbriši uplatu', editSavingsEntry:'Uredi uplatu u štednju', updateSavings:'Spremi uplatu',
  recurringExpense:'PONAVLJAJUĆI TROŠAK', scheduleExpense:'Zakaži trošak', recurringIntro:'Trošak će se automatski evidentirati na odabrani dan svakog mjeseca.', recurringDay:'Dan u mjesecu', startDate:'Datum početka', deleteRecurring:'Izbriši raspored', saveSchedule:'Spremi raspored', nextCharge:'Sljedeće terećenje: {date}', monthlyOnDay:'Mjesečno, {day}. dana', noRecurring:'Još nema zakazanih troškova.', recurringPreview:'Ako mjesec nema odabrani dan, trošak će se evidentirati posljednjeg dana tog mjeseca.',
  budgetLimitNear:'Upozorenje: iskorišteno je najmanje 80% budžeta', budgetLimitReached:'Ograničenje budžeta je dosegnuto', categoryCreated:'Kategorija je dodana.', categoryUpdated:'Kategorija je ažurirana.', categoryDeleted:'Kategorija je izbrisana, a povezane stavke premještene u Ostalo.', categoryNameRequired:'Unesite naziv kategorije.', duplicateCategory:'Kategorija s tim nazivom već postoji.',
  expenseUpdated:'Transakcija je ažurirana.', expenseDeleted:'Transakcija je izbrisana.', savingsUpdated:'Uplata u štednju je ažurirana.', savingsDeleted:'Uplata u štednju je izbrisana.', recurringSaved:'Ponavljajući trošak je spremljen.', recurringDeleted:'Ponavljajući trošak je izbrisan.', accountSwitched:'Aktivan je {account}.', csvExported:'CSV izvještaj je preuzet.',
  alertBudgetTitle:'Budžet kategorije zahtijeva pažnju', alertBudgetBody:'{category} je na {percent}% postavljenog ograničenja.', alertRecurringTitle:'Uskoro slijedi ponavljajući trošak', alertRecurringBody:'{name} ({amount}) dospijeva {date}.', alertSpendingTitle:'Mjesečni budžet je pri kraju', alertSpendingBody:'Preostalo je još {amount} sigurnog iznosa.', reviewBudget:'Pregledaj budžet', reviewRecurring:'Pregledaj raspored', reviewSpending:'Pregledaj potrošnju', noNotifications:'Nema novih upozorenja.', notificationCount:'{count} obavijesti', accountIsolation:'Podaci ovog računa potpuno su odvojeni.', csvFileName:'mer-troskovi-{account}-2026-08.csv', recurringInvalidDay:'Dan mora biti između 1 i 31.',
  navInsights:'Uvidi', reports:'IZVJEŠTAJI', insightsTitle:'Uvidi', insightsSubtitle:'Prihodi, troškovi i trendovi na jednom mjestu.', reportTimeframe:'Razdoblje izvještaja', daily:'Danas', monthly:'Ovaj mjesec', yearToDate:'Ova godina', allTime:'Sve vrijeme', cashflowSummary:'Sažetak novčanog toka', netTotal:'Neto ukupno', netInfo:'Informacije o neto iznosu', netTooltip:'Neto ukupno je zbroj prihoda umanjen za zbroj troškova u odabranom razdoblju.', incomeMinusExpenses:'Prihodi umanjeni za troškove', totalIncome:'Ukupni prihodi', totalExpenses:'Ukupni troškovi', income:'Prihod', expense:'Trošak', transactionsShort:'transakcija',
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
  alertBudgetTitle:'A category budget needs attention', alertBudgetBody:'{category} is at {percent}% of its limit.', alertRecurringTitle:'A recurring expense is coming up', alertRecurringBody:'{name} ({amount}) is due {date}.', alertSpendingTitle:'Your monthly budget is running low', alertSpendingBody:'Only {amount} remains safe to spend.', reviewBudget:'Review budget', reviewRecurring:'Review schedule', reviewSpending:'Review spending', noNotifications:'No new alerts.', notificationCount:'{count} notifications', accountIsolation:'This account’s data is completely isolated.', csvFileName:'mer-expenses-{account}-2026-08.csv', recurringInvalidDay:'Day must be between 1 and 31.',
  navInsights:'Insights', reports:'REPORTS', insightsTitle:'Insights', insightsSubtitle:'Income, expenses, and trends in one focused place.', reportTimeframe:'Report timeframe', daily:'Today', monthly:'This month', yearToDate:'This year', allTime:'All time', cashflowSummary:'Cash-flow summary', netTotal:'Net total', netInfo:'Net total information', netTooltip:'Net total is all income minus all expenses in the selected timeframe.', incomeMinusExpenses:'Income minus expenses', totalIncome:'Total income', totalExpenses:'Total expenses', income:'Income', expense:'Expense', transactionsShort:'transactions',
  savingsRate:'Savings rate', savingsRateInfo:'Savings rate information', savingsRateTooltip:'The percentage of recorded income left after all recorded expenses in the selected timeframe.', savingsRateContext:'The share of income left after expenses.', noIncomeRate:'Add income to calculate this rate.', momComparison:'Expense change', momInfo:'Comparison information', momTooltip:'Compares current-month expenses with total expenses from the previous month.', previousMonthComparison:'Compared with last month', moreSpent:'more spent', lessSpent:'less spent', sameSpent:'no change', noPreviousMonth:'No previous-month data', topSpendingCategory:'Top spending category', topCategoryInfo:'Top category information', topCategoryTooltip:'The category with the highest total expenses in the selected timeframe.', topCategoryContext:'{amount} · {share}% of all expenses', noExpensesPeriod:'No expenses in this timeframe',
  cashflowHistory:'CASH-FLOW HISTORY', incomeVsExpenses:'Income and expenses', cashflowChart:'Income and expense comparison', noDataTitle:'No data yet', noDataBody:'Add income or an expense to see analysis.', spendingMix:'SPENDING MIX', categoryBreakdown:'Expenses by category', noIncomeTitle:'No income recorded yet', noIncomeBody:'Add your first income to see a net total and savings rate.', addIncome:'Add income', customization:'CUSTOMIZATION', incomeCategories:'Income categories', newIncomeCategory:'New income category', incomeCategory:'INCOME CATEGORY', incomeCategoryIntro:'Organize income sources with a label that makes sense to you.',
  filterType:'Filter by type', allTypes:'All types', expensesOnly:'Expenses', incomeOnly:'Income', transactionType:'Transaction type', recordIncome:'RECORD INCOME', incomeIntro:'Recorded income will increase your available balance and appear in Insights.', incomePlaceholder:'e.g. August salary', incomeReady:'Income increases your balance', balanceIncrease:'Your available balance will increase to {amount}.', addIncomeSubmit:'Add income', editIncome:'Edit income', updateIncome:'Save income', deleteTransaction:'Delete transaction', incomeAdded:'Income added.', incomeUpdated:'Income updated.', incomeDeleted:'Income deleted.',
  salary:'Salary', gift:'Gift', freelance:'Freelance / side hustle', otherIncome:'Other income', incomeCategoryCreated:'Income category added.', incomeCategoryUpdated:'Income category updated.', incomeCategoryDeleted:'Income category deleted and linked entries moved to Other income.'
});

Object.assign(translations.hr, {
  userSettings:'KORISNIČKE POSTAVKE', connectedBanks:'Povezane banke i kartice', connectedBanksIntro:'Povežite račune putem sigurnog demonstracijskog Open Banking sloja i odredite profil za svaku vezu.', profileIsolationTitle:'Odvajanje profila je uključeno', profileIsolationBody:'Sinkronizirane transakcije zapisuju se samo u profil dodijeljen tom računu.', yourConnections:'Vaše veze', addConnection:'Dodaj vezu', noBankConnections:'Još nema povezanih računa', noBankConnectionsBody:'Povežite demo banku kako biste isprobali automatski uvoz bez dijeljenja stvarnih vjerodajnica.', secureDemoConnection:'SIGURNA DEMO VEZA', chooseInstitution:'Odaberite instituciju', chooseAccounts:'Odaberite račune ili kartice', assignProfile:'Dodijeli profilu', demoConsent:'Ovo je modularni demo provider. Ne traži ni ne sprema bankovne lozinke.', connectAndSync:'Poveži i sinkroniziraj', exportCsvHint:'Preuzmite sažetak aktivnog profila.', bankSyncStatus:'Status sinkronizacije banke', bankSyncReady:'Bankovna sinkronizacija', connectBank:'Poveži banku', syncNow:'Sinkroniziraj sada', syncing:'Sinkronizacija…', noConnectedAccounts:'Nema povezanih računa', lastSyncedNow:'Upravo sinkronizirano', lastSyncedMinutes:'Zadnja sinkronizacija prije {count} min', lastSyncedHours:'Zadnja sinkronizacija prije {count} h', neverSynced:'Čeka prvu sinkronizaciju', connectionsSummary:'{count} povezanih računa · aktivni profil: {profile}', connectedAccount:'Povezano', syncFailed:'Sinkronizacija nije uspjela', tokenExpired:'Bankovno odobrenje je isteklo. Ponovno povežite račun.', connectionLost:'Banka više nije dostupna. Ponovno povežite račun.', rateLimited:'Banka je privremeno ograničila sinkronizaciju. Pokušajte za {count} s.', reconnect:'Ponovno poveži', refreshConnection:'Osvježi vezu', unlinkConnection:'Odspoji račun', confirmUnlink:'Potvrdi odspajanje', mappingUpdated:'Račun je premješten u profil {profile}.', connectionUnlinked:'Veza je uklonjena. Prethodno uvezene transakcije ostaju u profilu.', accountsConnected:'Povezano je {count} računa. Uvezeno: {imported}.', syncComplete:'Sinkronizacija dovršena · {imported} novih, {duplicates} duplikata preskočeno.', noNewTransactions:'Nema novih transakcija.', selectAccount:'Odaberite barem jedan račun.', manualSource:'Ručno', autoSource:'Automatski', needsReview:'Potrebna kategorija', needsReviewShort:'za pregled', uncategorizedQueue:'Nekategorizirane transakcije', reviewQueueCopy:'{count} automatskih transakcija treba potvrdu kategorije.', showAllTransactions:'Prikaži sve', categoryApproved:'Kategorija je potvrđena.', alertUncategorizedTitle:'Nove transakcije trebaju pregled', alertUncategorizedBody:'{count} uvezenih transakcija nema sigurnu kategoriju.', reviewCategories:'Pregledaj kategorije', backgroundSync:'Automatska sinkronizacija svakih 5 minuta dok je aplikacija otvorena.'
});

Object.assign(translations.en, {
  userSettings:'USER SETTINGS', connectedBanks:'Connected Banks & Cards', connectedBanksIntro:'Connect accounts through a secure demo Open Banking layer and choose a profile for every connection.', profileIsolationTitle:'Profile isolation is on', profileIsolationBody:'Synced transactions are written only to the profile assigned to that account.', yourConnections:'Your connections', addConnection:'Add connection', noBankConnections:'No connected accounts yet', noBankConnectionsBody:'Connect a demo bank to try automatic imports without sharing real banking credentials.', secureDemoConnection:'SECURE DEMO CONNECTION', chooseInstitution:'Choose an institution', chooseAccounts:'Choose accounts or cards', assignProfile:'Assign to profile', demoConsent:'This is a modular demo provider. It never asks for or stores bank passwords.', connectAndSync:'Connect and sync', exportCsvHint:'Download a summary for the active profile.', bankSyncStatus:'Bank sync status', bankSyncReady:'Bank sync', connectBank:'Connect bank', syncNow:'Sync now', syncing:'Syncing…', noConnectedAccounts:'No connected accounts', lastSyncedNow:'Synced just now', lastSyncedMinutes:'Last synced {count} min ago', lastSyncedHours:'Last synced {count} hr ago', neverSynced:'Waiting for first sync', connectionsSummary:'{count} connected accounts · active profile: {profile}', connectedAccount:'Connected', syncFailed:'Sync failed', tokenExpired:'Bank authorization expired. Reconnect this account.', connectionLost:'The bank account is no longer available. Reconnect it.', rateLimited:'The bank temporarily limited syncing. Try again in {count}s.', reconnect:'Reconnect', refreshConnection:'Refresh connection', unlinkConnection:'Unlink account', confirmUnlink:'Confirm unlink', mappingUpdated:'Account moved to the {profile} profile.', connectionUnlinked:'Connection removed. Previously imported transactions remain in the profile.', accountsConnected:'Connected {count} accounts. Imported: {imported}.', syncComplete:'Sync complete · {imported} new, {duplicates} duplicates skipped.', noNewTransactions:'No new transactions.', selectAccount:'Select at least one account.', manualSource:'Manual', autoSource:'Automatic', needsReview:'Needs category', needsReviewShort:'to review', uncategorizedQueue:'Uncategorized transactions', reviewQueueCopy:'{count} automatic transactions need a category check.', showAllTransactions:'Show all', categoryApproved:'Category confirmed.', alertUncategorizedTitle:'New transactions need review', alertUncategorizedBody:'{count} imported transactions do not have a confident category.', reviewCategories:'Review categories', backgroundSync:'Automatic sync runs every 5 minutes while the app is open.'
});

const categoryMeta = {
  food:{ icon:'H', className:'food' }, transport:{ icon:'↗', className:'transport' }, shopping:{ icon:'K', className:'shopping' }, entertainment:{ icon:'▶', className:'entertainment' }, other:{ icon:'O', className:'other' }
};
const defaultIncomeCategories = [
  {id:'salary',nameKey:'salary',icon:'P',isCustom:false},
  {id:'gift',nameKey:'gift',icon:'D',isCustom:false},
  {id:'freelance',nameKey:'freelance',icon:'F',isCustom:false},
  {id:'otherIncome',nameKey:'otherIncome',icon:'O',isCustom:false}
];

const personalDefaults = {
  accountName:'Alex Morgan', accountLabel:'personalAccount', initials:'AM', income:4300, bills:1180, savingsTarget:620, savingsBalance:6240, savingsGoal:10000, guard:0.10, spent:1574.25, availableBalance:3840.60,
  categories:[{id:'food',spent:428.10,limit:600},{id:'transport',spent:164.20,limit:350},{id:'shopping',spent:382,limit:400},{id:'entertainment',spent:145.49,limit:250},{id:'other',spent:454.46,limit:470}],
  incomeCategories:structuredClone(defaultIncomeCategories),
  transactions:[
    {id:'i-aug-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-08-01T08:00:00'}, {id:'i-aug-freelance',type:'income',name:'Dizajn projekta',amount:450,category:'freelance',date:'2026-08-10T14:00:00'},
    {id:1,type:'expense',name:'Konzum',amount:42.18,category:'food',date:'2026-08-20T09:15:00'}, {id:2,type:'expense',name:'ZET',amount:15.93,category:'transport',date:'2026-08-20T08:10:00'}, {id:3,type:'expense',name:'dm',amount:27.60,category:'shopping',date:'2026-08-19T17:45:00'}, {id:4,type:'expense',name:'Netflix',amount:15.49,category:'entertainment',date:'2026-08-19T06:30:00'}, {id:5,type:'expense',name:'Tržnica Dolac',amount:31.80,category:'food',date:'2026-08-18T11:20:00'}, {id:6,type:'expense',name:'H&M',amount:68.00,category:'shopping',date:'2026-08-17T14:05:00'}, {id:7,type:'expense',name:'INA',amount:54.20,category:'transport',date:'2026-08-16T10:40:00'},
    {id:'aug-food',type:'expense',name:'Restorani i namirnice',amount:354.12,category:'food',date:'2026-08-14T19:00:00'}, {id:'aug-transport',type:'expense',name:'Prijevoz i gorivo',amount:94.07,category:'transport',date:'2026-08-13T09:00:00'}, {id:'aug-shopping',type:'expense',name:'Kućanske potrepštine',amount:286.40,category:'shopping',date:'2026-08-11T16:00:00'}, {id:'aug-entertainment',type:'expense',name:'Kino i događaji',amount:130,category:'entertainment',date:'2026-08-09T20:00:00'}, {id:'aug-other',type:'expense',name:'Računi i ostalo',amount:454.46,category:'other',date:'2026-08-05T10:00:00'},
    {id:'i-jul-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-07-01T08:00:00'}, {id:'i-jul-gift',type:'income',name:'Rođendanski dar',amount:100,category:'gift',date:'2026-07-12T12:00:00'}, {id:'e-jul-food',type:'expense',name:'Hrana i restorani',amount:520,category:'food',date:'2026-07-15T12:00:00'}, {id:'e-jul-transport',type:'expense',name:'Prijevoz',amount:260,category:'transport',date:'2026-07-13T12:00:00'}, {id:'e-jul-shopping',type:'expense',name:'Kupovina',amount:410,category:'shopping',date:'2026-07-10T12:00:00'}, {id:'e-jul-other',type:'expense',name:'Računi i ostalo',amount:610,category:'other',date:'2026-07-05T12:00:00'},
    {id:'i-jun-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-06-01T08:00:00'}, {id:'i-jun-freelance',type:'income',name:'Fotografiranje',amount:300,category:'freelance',date:'2026-06-18T12:00:00'}, {id:'e-jun-food',type:'expense',name:'Hrana i restorani',amount:490,category:'food',date:'2026-06-14T12:00:00'}, {id:'e-jun-other',type:'expense',name:'Ostali mjesečni troškovi',amount:1010,category:'other',date:'2026-06-06T12:00:00'},
    {id:'i-may-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-05-01T08:00:00'}, {id:'e-may',type:'expense',name:'Mjesečni troškovi',amount:1720,category:'other',date:'2026-05-15T12:00:00'}, {id:'i-apr-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-04-01T08:00:00'}, {id:'e-apr',type:'expense',name:'Mjesečni troškovi',amount:1680,category:'other',date:'2026-04-15T12:00:00'}, {id:'i-mar-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-03-01T08:00:00'}, {id:'e-mar',type:'expense',name:'Mjesečni troškovi',amount:1810,category:'other',date:'2026-03-15T12:00:00'}, {id:'i-feb-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-02-01T08:00:00'}, {id:'e-feb',type:'expense',name:'Mjesečni troškovi',amount:1590,category:'other',date:'2026-02-15T12:00:00'}, {id:'i-jan-salary',type:'income',name:'Plaća',amount:4300,category:'salary',date:'2026-01-01T08:00:00'}, {id:'e-jan',type:'expense',name:'Mjesečni troškovi',amount:1760,category:'other',date:'2026-01-15T12:00:00'}
  ],
  savingsHistory:[420,480,500,540,580,580,600,620],
  savingsEntries:[{id:'s1',amount:300,note:'Automatska štednja',date:'2026-08-03T08:00:00'},{id:'s2',amount:200,note:'Dodatna uplata',date:'2026-08-12T08:00:00'},{id:'s3',amount:120,note:'Zaokruživanje potrošnje',date:'2026-08-18T08:00:00'}],
  recurring:[{id:'r1',name:'Najamnina',amount:780,category:'other',day:1,startDate:'2026-09-01',enabled:true,lastProcessed:null},{id:'r2',name:'Internet',amount:29.90,category:'other',day:15,startDate:'2026-09-15',enabled:true,lastProcessed:null}]
};

const businessDefaults = {
  accountName:'Morgan Studio', accountLabel:'businessAccount', initials:'MS', income:8200, bills:3150, savingsTarget:1200, savingsBalance:12800, savingsGoal:25000, guard:0.15, spent:2460.70, availableBalance:9150.30,
  categories:[{id:'software',name:'Softver',icon:'S',spent:620.40,limit:900,isCustom:true},{id:'travel',name:'Putovanja',icon:'P',spent:780.30,limit:1100,isCustom:true},{id:'marketing',name:'Marketing',icon:'M',spent:540,limit:850,isCustom:true},{id:'office',name:'Ured',icon:'U',spent:520,limit:700,isCustom:true}],
  incomeCategories:structuredClone(defaultIncomeCategories),
  transactions:[{id:'bi1',type:'income',name:'Klijentski računi',amount:8200,category:'freelance',date:'2026-08-03T09:00:00'},{id:'b1',type:'expense',name:'Adobe',amount:72.50,category:'software',date:'2026-08-20T08:30:00'},{id:'b2',type:'expense',name:'Google Ads',amount:240,category:'marketing',date:'2026-08-19T12:10:00'},{id:'b3',type:'expense',name:'Croatia Airlines',amount:310.30,category:'travel',date:'2026-08-18T10:20:00'},{id:'be-rest',type:'expense',name:'Ostali poslovni troškovi',amount:1837.90,category:'office',date:'2026-08-10T12:00:00'},{id:'bi-jul',type:'income',name:'Klijentski računi',amount:7900,category:'freelance',date:'2026-07-03T09:00:00'},{id:'be-jul',type:'expense',name:'Poslovni troškovi',amount:2710,category:'office',date:'2026-07-15T12:00:00'}],
  savingsHistory:[800,900,950,1000,1050,1100,1150,1200],
  savingsEntries:[{id:'bs1',amount:700,note:'Porezna pričuva',date:'2026-08-05T08:00:00'},{id:'bs2',amount:500,note:'Poslovna rezerva',date:'2026-08-16T08:00:00'}],
  recurring:[{id:'br1',name:'Uredski najam',amount:950,category:'office',day:1,startDate:'2026-09-01',enabled:true,lastProcessed:null},{id:'br2',name:'Adobe Creative Cloud',amount:72.50,category:'software',day:15,startDate:'2026-09-15',enabled:true,lastProcessed:null}]
};

let appState;
try {
  const stored = JSON.parse(localStorage.getItem('mer-money-v5') || 'null');
  const versionFour = JSON.parse(localStorage.getItem('mer-money-v4') || 'null');
  const legacy = JSON.parse(localStorage.getItem('mer-money-v3') || 'null');
  const migratedPersonal=legacy?{...structuredClone(personalDefaults),...legacy,accountName:personalDefaults.accountName,accountLabel:personalDefaults.accountLabel,initials:personalDefaults.initials,savingsEntries:legacy.savingsEntries||structuredClone(personalDefaults.savingsEntries),recurring:legacy.recurring||structuredClone(personalDefaults.recurring)}:personalDefaults;
  appState = stored?.accounts ? stored : versionFour?.accounts ? versionFour : MerCore.createAccountStore(migratedPersonal,businessDefaults,{language:legacy?.language||'hr',theme:'light'});
} catch { appState = MerCore.createAccountStore(personalDefaults,businessDefaults,{language:'hr',theme:'light'}); }
appState.version=5;
appState.bankConnections=Array.isArray(appState.bankConnections)?appState.bankConnections:[];
function normalizeProfile(profile) {
  profile.transactions=profile.transactions||[];
  profile.transactions.forEach(transaction=>{transaction.type=MerCore.transactionType(transaction);transaction.source=transaction.source||tSourceManual();transaction.sourceType=transaction.sourceType||'manual';transaction.needsReview=Boolean(transaction.needsReview);});
  profile.incomeCategories=profile.incomeCategories?.length?profile.incomeCategories:structuredClone(defaultIncomeCategories);
}
function tSourceManual(){return 'Manual';}
Object.values(appState.accounts).forEach(normalizeProfile);
let state = appState.accounts[appState.activeAccount];
let currentLang = appState.language === 'en' ? 'en' : 'hr';
let currentTheme = appState.theme === 'dark' ? 'dark' : 'light';
let activeMonth = 7;
let activeView = 'overview';
let assessmentStep = 1;
let editingCategoryId = null;
let editingTransactionId = null;
let editingSavingsId = null;
let editingRecurringId = null;
let editingIncomeCategoryId = null;
let transactionType = 'expense';
let insightsTimeframe = 'monthly';
let activityReviewOnly = false;
let selectedBankProviderId = null;
let bankSyncInProgress = false;

const t = (key, values = {}) => {
  let text = translations[currentLang][key] ?? translations.hr[key] ?? key;
  Object.entries(values).forEach(([name,value]) => { text = text.replaceAll(`{${name}}`, value); });
  return text;
};
const locale = () => currentLang === 'hr' ? 'hr-HR' : 'en-IE';
const currency = (value, whole = false) => new Intl.NumberFormat(locale(), { style:'currency', currency:'EUR', minimumFractionDigits:whole ? 0 : 2, maximumFractionDigits:whole ? 0 : 2 }).format(Number(value) || 0);
const number = (value, digits = 1) => new Intl.NumberFormat(locale(), { maximumFractionDigits:digits }).format(value);
const categoryName = id => { const cat=state?.categories?.find(item=>item.id===id);return cat?.name || t(id); };
const categoryVisual = cat => categoryMeta[cat.id] || { icon:cat.icon || (cat.name || '?').slice(0,1).toUpperCase(), className:'custom' };
const incomeCategoryName = id => { const cat=state?.incomeCategories?.find(item=>item.id===id);return cat?.name || t(cat?.nameKey||id); };
const incomeCategoryVisual = cat => ({icon:cat?.icon||(incomeCategoryName(cat?.id||'otherIncome').slice(0,1).toUpperCase()),className:'income-category'});
const save = () => { appState.language=currentLang;appState.theme=currentTheme;appState.accounts[appState.activeAccount]=state;localStorage.setItem('mer-money-v5',JSON.stringify(appState)); };

function getPlan() { return MerCore.calculateBudget(state,12); }

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-i18n-placeholder]').forEach(el => el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder)));
  $$('[data-lang]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lang === currentLang)));
  $('#chartTitle').textContent = currentLang === 'hr' ? 'Tempo potrošnje u kolovozu' : 'August spending pace';
  $('#chartDesc').textContent = currentLang === 'hr' ? 'Kumulativna stvarna potrošnja uspoređena s planom.' : 'Cumulative actual spending compared with the plan.';
  document.title = currentLang === 'hr' ? 'mer Moj novac' : 'mer My money';
}

function applyTheme() {
  document.documentElement.dataset.theme=currentTheme;
  $('#themeToggle').setAttribute('aria-pressed',String(currentTheme==='dark'));
  $('#themeToggle span').textContent=t(currentTheme==='dark'?'lightMode':'darkMode');
}

function renderAccountContext() {
  $('#accountAvatar').textContent=state.initials;
  $('#accountName').textContent=state.accountName;
  $('#accountLabel').textContent=t(state.accountLabel);
  $$('[data-account]').forEach(button=>button.classList.toggle('active',button.dataset.account===appState.activeAccount));
  const greeting=currentLang==='hr'?`Dobro jutro, ${state.accountName}.`:`Good morning, ${state.accountName}.`;
  $('#overviewView h1').textContent=greeting;
}

function renderMonth() {
  const date = new Date(2026, activeMonth, 1);
  $('#monthLabel').textContent = new Intl.DateTimeFormat(locale(), { month:'long', year:'numeric' }).format(date);
  $('#budgetMonthOverline').textContent = new Intl.DateTimeFormat(locale(), { month:'long' }).format(date).toUpperCase();
  $('#todayLabel').textContent = t('todayDate');
  $('#prevMonth').disabled = activeMonth <= 0;
  $('#nextMonth').disabled = activeMonth >= 7;
}

function renderOverview() {
  const plan = getPlan();
  const percent = plan.monthlyBudget ? Math.round(state.spent / plan.monthlyBudget * 100) : 100;
  const goalPercent = Math.min(100, Math.round(state.savingsBalance / state.savingsGoal * 100));
  const monthName = new Intl.DateTimeFormat(locale(), { month:'long' }).format(new Date(2026, activeMonth, 1));
  $('#availableBalance').textContent = currency(state.availableBalance);
  $('#spentValue').textContent = currency(state.spent);
  $('#savedValue').textContent = currency(state.savingsTarget);
  $('#tipSavings').textContent = currency(state.savingsTarget, true);
  $('#chartSpent').textContent = currency(state.spent, true);
  $('#budgetPercent').textContent = t('budgetOf', { percent, budget:currency(plan.monthlyBudget, true) });
  $('#budgetProgress').style.width = `${Math.min(100, percent)}%`;
  $('#budgetProgressTrack').setAttribute('aria-valuenow', Math.min(100, percent));
  const totalThreshold=MerCore.budgetThreshold(state.spent,plan.monthlyBudget);
  $('#budgetProgressTrack').className=`progress-track threshold-${totalThreshold.level}`;
  $('#safeDaily').textContent = currency(plan.safeDaily, true);
  $('#safeRemaining').textContent = currency(plan.safeRemaining);
  $('#safePeriod').textContent = t('untilEndMonth', { month:monthName });
  $('#daysRemaining').textContent = t('daysRemaining', { days:plan.days });
  $('#safeRing').style.setProperty('--ring-value', Math.max(0, Math.min(100, 100 - percent)));
  const guard = $('#guardStatus');
  guard.classList.toggle('danger', percent > 100);
  $('strong', guard).textContent = t(percent > 100 ? 'overBudget' : 'withinBudget');
  $('#goalCurrent').textContent = currency(state.savingsBalance, true);
  $('#goalOf').textContent = t('goalOf', { target:currency(state.savingsGoal, true) });
  $('#goalPercent').textContent = `${goalPercent}%`;
  $('#goalProgress').style.width = `${goalPercent}%`;
  $('#goalProgressTrack').setAttribute('aria-valuenow', goalPercent);
  $('#goalDeposit').textContent = currency(state.savingsTarget, true);
  $('#goalFinish').textContent = savingsFinishDate();
  $('#calcIncome').textContent = currency(state.income, true);
  $('#calcBills').textContent = `−${currency(state.bills, true)}`;
  $('#calcSavings').textContent = `−${currency(state.savingsTarget, true)}`;
  $('#calcBuffer').textContent = `−${currency(plan.buffer, true)}`;
  $('#calcBudget').textContent = currency(plan.monthlyBudget, true);
  $('#calcSpent').textContent = `−${currency(state.spent)}`;
  $('#calcSafe').textContent = currency(plan.safeRemaining);
}

function levelClass(percent) { return `threshold-${percent>=100?'red':percent>=80?'yellow':'green'}`; }
function thresholdMessage(percent) { return percent>=100?t('budgetLimitReached'):percent>=80?t('budgetLimitNear'):''; }

function renderBudgetLists() {
  const overviewCategories = state.categories.slice(0, 3);
  $('#budgetList').innerHTML = overviewCategories.map(cat => {
    const pct = cat.limit ? Math.round(cat.spent / cat.limit * 100) : 100;
    const meta = categoryVisual(cat);
    return `<div class="budget-item"><div class="budget-item-header"><span class="category-icon ${meta.className}">${meta.icon}</span><div><div class="budget-item-title"><strong>${categoryName(cat.id)}</strong><span>${t('usedOf',{spent:currency(cat.spent,true),limit:currency(cat.limit,true)})}</span></div><div class="budget-bar"><span class="${levelClass(pct)}" style="width:${Math.min(100,pct)}%"></span></div>${pct>=80?`<small class="threshold-warning ${pct>=100?'is-red':''}">${thresholdMessage(pct)}</small>`:''}</div><span class="budget-percent">${pct}%</span></div></div>`;
  }).join('');
}

function renderBudgetView() {
  const plan = getPlan();
  const allocated = state.categories.reduce((sum,cat) => sum + cat.limit, 0);
  const difference = plan.monthlyBudget - allocated;
  const allocationPercent = plan.monthlyBudget ? Math.round(allocated / plan.monthlyBudget * 100) : 100;
  $('#fullBudgetValue').textContent = currency(plan.monthlyBudget, true);
  $('#fullRemainingValue').textContent = currency(plan.safeRemaining);
  $('#allocatedValue').textContent = currency(allocated, true);
  $('#unallocatedValue').textContent = difference >= 0 ? t('allocated',{amount:currency(difference,true)}) : t('overAllocated',{amount:currency(Math.abs(difference),true)});
  $('#allocationStatus').textContent = t('allocationPercent',{percent:allocationPercent});
  $('#allocationProgress').style.width = `${Math.min(100,allocationPercent)}%`;
  $('.allocation-bar').classList.toggle('over', allocationPercent > 100);
  $('#allocationCopy').textContent = t('allocationCopy',{allocated:currency(allocated,true),budget:currency(plan.monthlyBudget,true)});
  $('#budgetTable').innerHTML = state.categories.map(cat => {
    const pct = cat.limit ? Math.round(cat.spent / cat.limit * 100) : 100;
    const meta = categoryVisual(cat);
    const remaining = Math.max(0, cat.limit - cat.spent);
    return `<div class="budget-row"><div class="budget-category"><span class="category-icon ${meta.className}">${meta.icon}</span><div><strong>${categoryName(cat.id)}</strong><small class="${pct>=80?'threshold-warning':''}">${pct>=80?thresholdMessage(pct):`${currency(remaining,true)} ${currentLang==='hr'?'preostalo':'remaining'}`}</small></div></div><div class="budget-row-progress"><div class="budget-bar"><span class="${levelClass(pct)}" style="width:${Math.min(100,pct)}%"></span></div><span class="budget-percent">${pct}%</span></div><div class="budget-row-value">${currency(cat.spent,true)} / ${currency(cat.limit,true)}</div><button class="icon-button small edit-budget" data-edit-budget="${cat.id}" aria-label="${currentLang === 'hr' ? 'Uredi budžet za' : 'Edit budget for'} ${categoryName(cat.id)}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div>`;
  }).join('');
  $$('[data-edit-budget]').forEach(button => button.addEventListener('click', () => openBudgetEditor(button.dataset.editBudget)));
}

function savingsFinishDate() {
  const remaining = Math.max(0, state.savingsGoal - state.savingsBalance);
  const months = state.savingsTarget > 0 ? Math.ceil(remaining / state.savingsTarget) : 0;
  const finish = new Date(2026, 7 + months, 1);
  return new Intl.DateTimeFormat(locale(), { month:'long', year:'numeric' }).format(finish);
}

function renderSavingsView() {
  const pct = Math.min(100, Math.round(state.savingsBalance / state.savingsGoal * 100));
  $('#savingsHeroCurrent').textContent = currency(state.savingsBalance, true);
  $('#savingsHeroTarget').textContent = t('goalTargetOf',{target:currency(state.savingsGoal,true)});
  $('#savingsHeroProgress').style.width = `${pct}%`;
  $('#stillNeeded').textContent = currency(Math.max(0,state.savingsGoal-state.savingsBalance),true);
  $('#savingsMonthly').textContent = currency(state.savingsTarget,true);
  $('#savingsFinish').textContent = savingsFinishDate();
  $('#coverageMonths').textContent = t('months',{value:number(state.savingsBalance / Math.max(1,state.bills),1)});
  const sum = state.savingsHistory.reduce((a,b)=>a+b,0);
  $('#yearSaved').textContent = currency(sum,true);
  $('#chartTotalSaved').textContent=currency(sum);
  const max = Math.max(...state.savingsHistory,1);
  const monthsHr = ['sij','velj','ožu','tra','svi','lip','srp','kol'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'];
  $('#contributionChart').innerHTML = state.savingsHistory.map((amount,index) => `<div class="contribution-column ${index===state.savingsHistory.length-1?'current':''}" aria-label="${(currentLang==='hr'?monthsHr:monthsEn)[index]}: ${currency(amount)}"><b>${currency(amount,true)}</b><span style="height:${Math.max(4,amount/max*125)}px"></span><small>${(currentLang==='hr'?monthsHr:monthsEn)[index]}</small></div>`).join('');
}

function renderSavingsEntries() {
  state.savingsEntries=state.savingsEntries||[];
  $('#savingsEntryList').innerHTML=state.savingsEntries.length?state.savingsEntries.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(entry=>`<div class="savings-entry-item"><span class="savings-entry-icon"><svg aria-hidden="true"><use href="#icon-leaf"></use></svg></span><div class="savings-entry-copy"><strong>${escapeHtml(entry.note)}</strong><small>${new Intl.DateTimeFormat(locale(),{day:'numeric',month:'long',year:'numeric'}).format(new Date(entry.date))}</small></div><span class="savings-entry-amount">+${currency(entry.amount)}</span><button type="button" class="icon-button small" data-edit-savings="${entry.id}" aria-label="${t('editSavingsEntry')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div>`).join(''):`<div class="notification-empty">${t('emptyActivity')}</div>`;
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
  $('#connectedBankCount').textContent=connections.length;
  $('#uncategorizedCount').textContent=reviewCount;
  $('#uncategorizedBadge').hidden=reviewCount===0;
  const status=$('#bankSyncStatus');
  const button=$('#syncNow');
  $('.sync-symbol').classList.toggle('syncing',bankSyncInProgress);
  button.disabled=bankSyncInProgress;
  $('span',button).textContent=t(bankSyncInProgress?'syncing':connections.length?'syncNow':'connectBank');
  if(!connections.length){status.textContent=t('noConnectedAccounts');return;}
  const latest=connections.filter(item=>item.lastSyncedAt).sort((a,b)=>new Date(b.lastSyncedAt)-new Date(a.lastSyncedAt))[0];
  const error=connections.find(item=>item.status==='error');
  status.textContent=error?connectionStatusLabel(error).text:`${lastSyncedLabel(latest)} · ${t('backgroundSync')}`;
}

function renderProviderPicker() {
  const providers=MerBankProviders.getProviders();
  $('#providerGrid').innerHTML=providers.map(provider=>`<button type="button" class="provider-option ${selectedBankProviderId===provider.id?'active':''}" data-provider-id="${provider.id}" aria-pressed="${selectedBankProviderId===provider.id}"><span class="institution-mark" style="background:${provider.color}">${escapeHtml(provider.name.slice(0,3))}</span><span><strong>${escapeHtml(provider.name)}</strong><small>${escapeHtml(provider.region)}</small></span></button>`).join('');
  $$('[data-provider-id]').forEach(button=>button.addEventListener('click',()=>selectBankProvider(button.dataset.providerId)));
  if(selectedBankProviderId)renderProviderAccounts();
}

function selectBankProvider(providerId) {
  selectedBankProviderId=providerId;
  renderProviderPicker();
  $('#bankAccountPicker').hidden=false;
  $('#bankProfileLabel').hidden=false;
  $('#bankConsentCopy').hidden=false;
  $('#connectSelectedAccounts').hidden=false;
}

function renderProviderAccounts() {
  const provider=MerBankProviders.getProvider(selectedBankProviderId);if(!provider)return;
  const alreadyConnected=new Set(appState.bankConnections.filter(connection=>connection.providerId===provider.id).map(connection=>connection.accountId));
  $('#providerAccountList').innerHTML=provider.accounts.map(account=>`<label class="bank-account-choice"><input type="checkbox" name="bankAccount" value="${account.id}" ${alreadyConnected.has(account.id)?'disabled':''}><span><strong>${escapeHtml(account.name)} ${escapeHtml(account.mask)}</strong><small>${escapeHtml(currentLang==='hr'?account.kind:account.kindEn)}${alreadyConnected.has(account.id)?` · ${t('connectedAccount')}`:''}</small></span></label>`).join('');
}

function renderBankSettings() {
  const connections=appState.bankConnections;
  $('#settingsConnectionSummary').textContent=t('connectionsSummary',{count:connections.length,profile:t(state.accountLabel)});
  $('#bankEmptyState').hidden=connections.length>0;
  $('#bankConnectionList').innerHTML=connections.map(connection=>{const provider=MerBankProviders.getProvider(connection.providerId);const status=connectionStatusLabel(connection);return `<article class="bank-connection-card"><span class="institution-mark" style="background:${provider?.color||'#16574b'}">${escapeHtml(connection.institution.slice(0,3))}</span><div class="connection-copy"><strong>${escapeHtml(connection.accountName)} ${escapeHtml(connection.accountMask)}</strong><span>${escapeHtml(currentLang==='hr'?connection.accountKind:connection.accountKindEn)}</span><small class="connection-status ${status.className}">${escapeHtml(status.text)}</small></div><label class="connection-mapping"><span>${t('assignProfile')}</span><select data-map-bank="${connection.id}" aria-label="${t('assignProfile')}"><option value="personal" ${connection.profileId==='personal'?'selected':''}>${t('personalAccount')}</option><option value="business" ${connection.profileId==='business'?'selected':''}>${t('businessAccount')}</option></select></label><div class="connection-actions"><button type="button" class="icon-button" data-refresh-bank="${connection.id}" aria-label="${t(connection.lastErrorCode==='TOKEN_EXPIRED'||connection.lastErrorCode==='DISCONNECTED'?'reconnect':'refreshConnection')}"><svg aria-hidden="true"><use href="#icon-refresh"></use></svg></button><button type="button" class="icon-button danger-icon" data-unlink-bank="${connection.id}" aria-label="${t('unlinkConnection')}"><svg aria-hidden="true"><use href="#icon-unlink"></use></svg></button></div></article>`;}).join('');
  $$('[data-map-bank]').forEach(select=>select.addEventListener('change',()=>mapBankConnection(select.dataset.mapBank,select.value)));
  $$('[data-refresh-bank]').forEach(button=>button.addEventListener('click',()=>refreshBankConnection(button.dataset.refreshBank)));
  $$('[data-unlink-bank]').forEach(button=>button.addEventListener('click',()=>requestUnlinkBank(button)));
  renderProviderPicker();
}

function openBankSettings() { toggleAccountMenu(false);selectedBankProviderId=null;$('#bankConnectForm').hidden=true;renderBankSettings();openModal($('#bankSettingsModal')); }

function applyTransactionEffectToProfile(profile,transaction,direction=1) {
  const amount=Math.max(0,Number(transaction.amount)||0)*direction;
  if(MerCore.transactionType(transaction)==='income'){profile.availableBalance+=amount;return;}
  profile.availableBalance-=amount;
  if(String(transaction?.date||'').startsWith('2026-08')){
    profile.spent=Math.max(0,profile.spent+amount);
    const category=profile.categories.find(item=>item.id===transaction.category);if(category)category.spent=Math.max(0,category.spent+amount);
  }
}

async function syncBankConnection(connection,{silent=false}={}) {
  const profile=appState.accounts[connection.profileId];if(!profile)return {imported:0,duplicates:0,uncategorized:0,error:'DISCONNECTED'};
  try{
    const response=await MerBankProviders.fetchTransactions(connection);
    const result=MerCore.importBankTransactions(profile,connection,response.transactions);
    result.imported.forEach(transaction=>applyTransactionEffectToProfile(profile,transaction,1));
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
  if(!connections.length){openBankSettings();return;}
  if(bankSyncInProgress)return;
  bankSyncInProgress=true;renderBankSyncStatus();
  const results=[];for(const connection of connections)results.push(await syncBankConnection(connection,{silent}));
  bankSyncInProgress=false;save();renderAll();
  if(!silent){const imported=results.reduce((sum,result)=>sum+result.imported,0),duplicates=results.reduce((sum,result)=>sum+result.duplicates,0);if(!results.some(result=>result.error))showToast(imported?t('syncComplete',{imported,duplicates}):t('noNewTransactions'));}
}

async function refreshBankConnection(connectionId) {
  const connection=appState.bankConnections.find(item=>item.id===connectionId);if(!connection)return;
  MerBankProviders.renewConnection(connection);bankSyncInProgress=true;renderBankSyncStatus();const result=await syncBankConnection(connection);bankSyncInProgress=false;save();renderAll();renderBankSettings();if(!result.error)showToast(result.imported?t('syncComplete',{imported:result.imported,duplicates:result.duplicates}):t('noNewTransactions'));
}

async function mapBankConnection(connectionId,profileId) {
  const connection=appState.bankConnections.find(item=>item.id===connectionId);if(!connection||connection.profileId===profileId)return;
  const previousProfile=appState.accounts[connection.profileId];
  const moved=(previousProfile.transactions||[]).filter(transaction=>transaction.connectionId===connection.id);
  moved.forEach(transaction=>applyTransactionEffectToProfile(previousProfile,transaction,-1));
  previousProfile.transactions=previousProfile.transactions.filter(transaction=>transaction.connectionId!==connection.id);
  connection.profileId=profileId==='business'?'business':'personal';connection.cursor=0;connection.lastAttemptAt=null;connection.lastSyncedAt=null;connection.status='connected';connection.lastErrorCode=null;
  await syncBankConnection(connection,{silent:true});save();state=appState.accounts[appState.activeAccount];renderAll();renderBankSettings();showToast(t('mappingUpdated',{profile:t(appState.accounts[connection.profileId].accountLabel)}));
}

function requestUnlinkBank(button) {
  if(button.dataset.confirmUnlink!=='true'){button.dataset.confirmUnlink='true';button.classList.add('confirming');button.setAttribute('aria-label',t('confirmUnlink'));button.innerHTML='<svg aria-hidden="true"><use href="#icon-check"></use></svg>';setTimeout(()=>{if(button.isConnected){button.dataset.confirmUnlink='false';button.classList.remove('confirming');button.setAttribute('aria-label',t('unlinkConnection'));button.innerHTML='<svg aria-hidden="true"><use href="#icon-unlink"></use></svg>'; }},3500);return;}
  appState.bankConnections=appState.bankConnections.filter(connection=>connection.id!==button.dataset.unlinkBank);save();renderAll();renderBankSettings();showToast(t('connectionUnlinked'));
}

async function connectSelectedBankAccounts(event) {
  event.preventDefault();
  const selected=$$('input[name="bankAccount"]:checked',$('#bankConnectForm')).map(input=>input.value);if(!selected.length){showToast(t('selectAccount'));return;}
  const profileId=$('#bankProfileSelect').value==='business'?'business':'personal';const connections=selected.map((accountId,index)=>MerBankProviders.createConnection(selectedBankProviderId,accountId,profileId,Date.now()+index));appState.bankConnections.push(...connections);
  bankSyncInProgress=true;const results=[];for(const connection of connections)results.push(await syncBankConnection(connection,{silent:true}));bankSyncInProgress=false;selectedBankProviderId=null;$('#bankConnectForm').hidden=true;save();renderAll();renderBankSettings();showToast(t('accountsConnected',{count:connections.length,imported:results.reduce((sum,result)=>sum+result.imported,0)}));
}

function formatIsoDate(value) { return new Intl.DateTimeFormat(locale(),{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${value}T12:00:00`)); }

function renderRecurring() {
  state.recurring=state.recurring||[];
  $('#recurringList').innerHTML=state.recurring.length?state.recurring.map(rule=>{const next=MerCore.nextOccurrence(rule,'2026-08-20');return `<div class="recurring-item"><span class="recurring-date-icon"><svg aria-hidden="true"><use href="#icon-calendar"></use></svg></span><div class="recurring-copy"><strong>${escapeHtml(rule.name)}</strong><small>${t('monthlyOnDay',{day:rule.day})} · ${t('nextCharge',{date:formatIsoDate(next)})}</small></div><span class="recurring-amount">−${currency(rule.amount)}</span><button type="button" class="icon-button small" data-edit-recurring="${rule.id}" aria-label="${t('editExpense')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div>`;}).join(''):`<div class="notification-empty">${t('noRecurring')}</div>`;
  $$('[data-edit-recurring]').forEach(button=>button.addEventListener('click',()=>openRecurring(button.dataset.editRecurring)));
}

function buildNotifications() {
  const notifications=[];
  const reviewCount=uncategorizedTransactions().length;if(reviewCount)notifications.push({type:'warning',icon:'icon-alert',title:t('alertUncategorizedTitle'),body:t('alertUncategorizedBody',{count:reviewCount}),action:t('reviewCategories'),view:'activity',reviewOnly:true});
  state.categories.forEach(cat=>{const threshold=MerCore.budgetThreshold(cat.spent,cat.limit);if(threshold.percent>=80)notifications.push({type:threshold.level==='red'?'danger':'warning',icon:'icon-wallet',title:t('alertBudgetTitle'),body:t('alertBudgetBody',{category:categoryName(cat.id),percent:Math.round(threshold.percent)}),action:t('reviewBudget'),view:'budgets'});});
  (state.recurring||[]).forEach(rule=>{const next=MerCore.nextOccurrence(rule,'2026-08-20');if(next){const days=Math.round((new Date(`${next}T12:00:00`)-new Date('2026-08-20T12:00:00'))/86400000);if(days<=20)notifications.push({type:'info',icon:'icon-calendar',title:t('alertRecurringTitle'),body:t('alertRecurringBody',{name:rule.name,amount:currency(rule.amount),date:formatIsoDate(next)}),action:t('reviewRecurring'),view:'budgets'});}});
  const plan=getPlan();if(plan.monthlyBudget&&plan.safeRemaining/plan.monthlyBudget<.25)notifications.push({type:'warning',icon:'icon-shield',title:t('alertSpendingTitle'),body:t('alertSpendingBody',{amount:currency(plan.safeRemaining)}),action:t('reviewSpending'),view:'activity'});
  return notifications.slice(0,6);
}

function renderNotifications() {
  const notifications=buildNotifications();
  $('#notificationCount').textContent=notifications.length;
  $('#notificationCount').hidden=notifications.length===0;
  $('#notificationButton').setAttribute('aria-label',t('notificationCount',{count:notifications.length}));
  $('#notificationList').innerHTML=notifications.length?notifications.map((item,index)=>`<article class="notification-item"><span class="notification-symbol ${item.type}"><svg aria-hidden="true"><use href="#${item.icon}"></use></svg></span><div class="notification-copy"><strong>${item.title}</strong><p>${item.body}</p><button type="button" class="link-button" data-notification-view="${item.view}" data-notification-review="${item.reviewOnly?'true':'false'}" data-notification-index="${index}">${item.action}<span aria-hidden="true">→</span></button></div></article>`).join(''):`<div class="notification-empty">${t('noNotifications')}</div>`;
  $$('[data-notification-view]').forEach(button=>button.addEventListener('click',()=>{activityReviewOnly=button.dataset.notificationReview==='true';showView(button.dataset.notificationView);renderActivity();closeNotifications();}));
}

function renderCategorySelects() {
  const transactionValue = $('#transactionCategory').value;
  const transactionCategories=transactionType==='income'?state.incomeCategories:state.categories;
  $('#transactionCategory').innerHTML = transactionCategories.map(cat => `<option value="${cat.id}">${transactionType==='income'?incomeCategoryName(cat.id):categoryName(cat.id)}</option>`).join('');
  if (transactionCategories.some(cat=>cat.id===transactionValue)) $('#transactionCategory').value = transactionValue;
  const filterValue = $('#activityFilter').value || 'all';
  $('#activityFilter').innerHTML = `<option value="all">${t('allCategories')}</option><optgroup label="${t('expensesOnly')}">${state.categories.map(cat=>`<option value="${cat.id}">${categoryName(cat.id)}</option>`).join('')}</optgroup><optgroup label="${t('incomeOnly')}">${state.incomeCategories.map(cat=>`<option value="income:${cat.id}">${incomeCategoryName(cat.id)}</option>`).join('')}</optgroup>`;
  if (filterValue==='all' || state.categories.some(cat=>cat.id===filterValue) || state.incomeCategories.some(cat=>`income:${cat.id}`===filterValue)) $('#activityFilter').value = filterValue;
  const recurringValue=$('#recurringCategoryInput').value;
  $('#recurringCategoryInput').innerHTML=state.categories.map(cat=>`<option value="${cat.id}">${categoryName(cat.id)}</option>`).join('');
  if(state.categories.some(cat=>cat.id===recurringValue))$('#recurringCategoryInput').value=recurringValue;
}

function formatTransactionDate(iso) {
  const date = new Date(iso);
  const dateKey=String(iso).slice(0,10);
  const key = dateKey==='2026-08-20' ? 'dateToday' : dateKey==='2026-08-19' ? 'dateYesterday' : null;
  return key ? t(key) : new Intl.DateTimeFormat(locale(),{day:'numeric',month:'long',year:'numeric'}).format(date);
}

function renderActivity() {
  const search = ($('#activitySearch').value || '').trim().toLocaleLowerCase(locale());
  const filter = $('#activityFilter').value || 'all';
  const typeFilter=$('#activityTypeFilter').value||'all';
  const reviewCount=uncategorizedTransactions().length;
  $('#reviewQueueBanner').hidden=!activityReviewOnly;
  $('#reviewQueueCopy').textContent=t('reviewQueueCopy',{count:reviewCount});
  const filtered = state.transactions.filter(tx => {
    const type=MerCore.transactionType(tx);const name=type==='income'?incomeCategoryName(tx.category):categoryName(tx.category);
    const categoryMatches=filter==='all'||(filter.startsWith('income:')?type==='income'&&tx.category===filter.slice(7):type==='expense'&&tx.category===filter);
    return (!activityReviewOnly||tx.needsReview)&&categoryMatches&&(typeFilter==='all'||type===typeFilter)&&(!search||tx.name.toLocaleLowerCase(locale()).includes(search)||name.toLocaleLowerCase(locale()).includes(search));
  }).slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  $('#activityEmpty').hidden = filtered.length > 0;
  let lastDate = '';
  $('#transactionList').innerHTML = filtered.map(tx => {
    const dateLabel = formatTransactionDate(tx.date);
    const header = dateLabel!==lastDate ? `<div class="transaction-date">${dateLabel}</div>` : '';
    lastDate = dateLabel;
    const type=MerCore.transactionType(tx);const txCategory=type==='income'?state.incomeCategories.find(cat=>cat.id===tx.category):state.categories.find(cat=>cat.id===tx.category);const meta=type==='income'?incomeCategoryVisual(txCategory):(txCategory?categoryVisual(txCategory):categoryMeta.other);const displayCategory=type==='income'?incomeCategoryName(tx.category):categoryName(tx.category);
    const sourceLabel=tx.sourceType==='auto'?tx.source:t('manualSource');
    return `${header}<div class="transaction-item ${type}"><span class="category-icon ${meta.className}">${meta.icon}</span><div class="transaction-copy"><strong>${escapeHtml(tx.name)}</strong><div class="transaction-meta"><small>${new Intl.DateTimeFormat(locale(),{hour:'2-digit',minute:'2-digit'}).format(new Date(tx.date))}</small><span class="transaction-source ${tx.sourceType==='auto'?'auto':''}">${escapeHtml(sourceLabel)}</span>${tx.needsReview?`<span class="needs-review-tag">${t('needsReview')}</span>`:''}</div></div><span class="transaction-category">${displayCategory}</span><span class="transaction-amount ${type}">${type==='income'?'+':'−'}${currency(tx.amount)}</span><button type="button" class="icon-button small" data-edit-transaction="${tx.id}" aria-label="${t(type==='income'?'editIncome':'editExpense')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button></div>`;
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
  $('#incomeCategoryList').innerHTML=state.incomeCategories.map(cat=>{const visual=incomeCategoryVisual(cat);const count=state.transactions.filter(tx=>MerCore.transactionType(tx)==='income'&&tx.category===cat.id).length;return `<div class="income-category-item"><span class="category-icon ${visual.className}">${escapeHtml(visual.icon)}</span><div><strong>${escapeHtml(incomeCategoryName(cat.id))}</strong><small>${count} ${t('transactionsShort')}</small></div>${cat.isCustom?`<button type="button" class="icon-button small" data-edit-income-category="${cat.id}" aria-label="${t('editIncome')}"><svg aria-hidden="true"><use href="#icon-edit"></use></svg></button>`:'<span class="default-category-mark">mer</span>'}</div>`;}).join('');
  $$('[data-edit-income-category]').forEach(button=>button.addEventListener('click',()=>openIncomeCategoryEditor(button.dataset.editIncomeCategory)));
}

function renderInsights() {
  const reference='2026-08-20';
  const filtered=MerCore.filterTransactions(state.transactions,insightsTimeframe,reference);
  const totals=MerCore.transactionTotals(state.transactions,insightsTimeframe,reference);
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
  if(!chartEmpty){const max=Math.max(...groups.flatMap(group=>[group.income,group.expenses]),1);$('#cashflowChart').innerHTML=groups.map(group=>`<div class="cashflow-column" aria-label="${cashflowLabel(group.key)}: ${t('income')} ${currency(group.income)}, ${t('expense')} ${currency(group.expenses)}"><div class="cashflow-bars"><span class="income-bar" style="height:${Math.max(group.income?8:0,group.income/max*150)}px"><b>${group.income?currency(group.income,true):''}</b></span><span class="expense-bar" style="height:${Math.max(group.expenses?8:0,group.expenses/max*150)}px"><b>${group.expenses?currency(group.expenses,true):''}</b></span></div><small>${cashflowLabel(group.key)}</small></div>`).join('');}
  const expenses=filtered.filter(tx=>MerCore.transactionType(tx)==='expense');const expenseTotal=expenses.reduce((sum,tx)=>sum+Number(tx.amount||0),0);const byCategory={};expenses.forEach(tx=>{byCategory[tx.category]=(byCategory[tx.category]||0)+Number(tx.amount||0);});const breakdown=Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
  $('#categoryBreakdown').innerHTML=breakdown.length?breakdown.map(([id,amount])=>{const pct=expenseTotal?amount/expenseTotal*100:0;return `<div class="breakdown-row"><div><strong>${categoryName(id)}</strong><span>${currency(amount)}</span></div><div class="breakdown-track"><span style="width:${pct}%"></span></div><small>${number(pct,0)}%</small></div>`;}).join(''):`<div class="notification-empty">${t('noExpensesPeriod')}</div>`;
  renderIncomeCategories();
}

function renderAll() {
  renderMonth();renderAccountContext();renderOverview();renderBudgetLists();renderBudgetView();renderSavingsView();renderSavingsEntries();renderUpcoming();renderRecurring();renderCategorySelects();renderActivity();renderInsights();renderNotifications();renderBankSyncStatus();if($('#bankSettingsModal').open)renderBankSettings();applyTheme();
}

function setLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'hr';
  applyStaticTranslations(); renderAll(); save();
}

function showToast(message) {
  const toast = $('#toast'); $('span',toast).textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove('show'),2600);
}

function openModal(modal) { $('#modalBackdrop').hidden=false; modal.showModal(); }
function closeModal(modal) { if (modal?.open) modal.close(); $('#modalBackdrop').hidden=true; }

function showView(view) {
  activeView = view;
  $$('[data-view-panel]').forEach(panel => { const active=panel.dataset.viewPanel===view; panel.hidden=!active; panel.classList.toggle('active',active); });
  $$('.nav-item').forEach(item => { const active=item.dataset.view===view; item.classList.toggle('active',active); if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current'); });
  closeSidebar();
  window.scrollTo({top:0,behavior:'smooth'});
}

function openSidebar() { $('#sidebar').classList.add('open'); $('#sidebarScrim').hidden=false; $('#menuToggle').setAttribute('aria-expanded','true'); $('#menuToggle').setAttribute('aria-label',t('closeNav')); }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sidebarScrim').hidden=true; $('#menuToggle').setAttribute('aria-expanded','false'); $('#menuToggle').setAttribute('aria-label',t('openNav')); }

function toggleAccountMenu(force) { const menu=$('#accountMenu'),willOpen=typeof force==='boolean'?force:menu.hidden;menu.hidden=!willOpen;$('#openSettings').setAttribute('aria-expanded',String(willOpen)); }
function closeNotifications() { $('#notificationCenter').hidden=true;$('#notificationButton').setAttribute('aria-expanded','false'); }
function toggleNotifications() { const open=$('#notificationCenter').hidden;$('#notificationCenter').hidden=!open;$('#notificationButton').setAttribute('aria-expanded',String(open));if(open)toggleAccountMenu(false); }
function switchAccount(accountId) { if(!appState.accounts[accountId]||accountId===appState.activeAccount)return;save();appState.activeAccount=accountId;state=appState.accounts[accountId];activityReviewOnly=false;processDueRecurring(state);save();renderAll();toggleAccountMenu(false);showView('overview');showToast(t('accountSwitched',{account:state.accountName})); }
function toggleTheme() { currentTheme=currentTheme==='dark'?'light':'dark';applyTheme();save(); }

function processDueRecurring(profile) {
  profile.recurring=profile.recurring||[];profile.transactions=profile.transactions||[];
  profile.recurring.forEach(rule=>{const start=new Date(`${rule.startDate}T12:00:00Z`);const from=rule.lastProcessed||new Date(start.getTime()-86400000).toISOString().slice(0,10);MerCore.occurrencesBetween(rule,from,'2026-08-20').forEach(date=>{const key=`${rule.id}:${date}`;if(profile.transactions.some(tx=>tx.recurringKey===key))return;const cat=profile.categories.find(item=>item.id===rule.category)||profile.categories[0];profile.transactions.unshift({id:`rec-${key}`,type:'expense',name:rule.name,amount:rule.amount,category:cat.id,date:`${date}T08:00:00`,recurringKey:key,source:'Manual',sourceType:'manual',needsReview:false});profile.spent+=rule.amount;profile.availableBalance-=rule.amount;cat.spent+=rule.amount;});rule.lastProcessed='2026-08-20';});
}

function exportCsv() {
  const csv=MerCore.monthlyExpenseCsv(state,'2026-08');const fileName=t('csvFileName',{account:appState.activeAccount});const blob=new Blob([`\ufeff${csv}`],{type:'text/csv;charset=utf-8'});const link=document.createElement('a');link.download=fileName;link.href=typeof URL.createObjectURL==='function'?URL.createObjectURL(blob):`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;document.body.appendChild(link);link.click();link.remove();if(link.href.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(link.href),0);showToast(t('csvExported'));
}

function showTooltip(trigger) { const tip=$('#appTooltip');tip.textContent=t(trigger.dataset.tooltipKey);tip.hidden=false;const rect=trigger.getBoundingClientRect();const width=Math.min(260,window.innerWidth-24);const left=Math.max(12,Math.min(window.innerWidth-width-12,rect.left+rect.width/2-width/2));tip.style.left=`${left}px`;tip.style.top=`${Math.max(8,rect.top-8)}px`;tip.style.transform='translateY(-100%)'; }
function hideTooltip() { $('#appTooltip').hidden=true; }

function resetTransactionCheck() {
  $('#transactionSubmit').disabled=false;
  $('#spendCheck').className='spend-check';
  $('#spendCheck').innerHTML=`<svg aria-hidden="true"><use href="#icon-shield"></use></svg><div><strong>${t('guardReady')}</strong><span>${t('enterImpact')}</span></div>`;
}

function transactionAffectsCurrentBudget(transaction) { return String(transaction?.date||'').startsWith('2026-08'); }
function applyTransactionEffect(transaction,direction=1) {
  applyTransactionEffectToProfile(state,transaction,direction);
}

function setTransactionType(type) {
  transactionType=type==='income'?'income':'expense';
  $$('[data-transaction-type]').forEach(button=>{const active=button.dataset.transactionType===transactionType;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  $('#transactionOverline').textContent=t(transactionType==='income'?'recordIncome':'recordSpending');
  $('#transactionIntro').textContent=t(transactionType==='income'?'incomeIntro':'transactionIntro');
  $('#transactionName').setAttribute('placeholder',t(transactionType==='income'?'incomePlaceholder':'merchantPlaceholder'));
  const existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;
  $('#transactionTitle').textContent=t(existing?(transactionType==='income'?'editIncome':'editExpense'):(transactionType==='income'?'addIncome':'addTransaction'));
  $('#transactionSubmit').textContent=t(existing?(transactionType==='income'?'updateIncome':'updateExpense'):(transactionType==='income'?'addIncomeSubmit':'checkAddTransaction'));
  renderCategorySelects();resetTransactionCheck();evaluateTransaction();
}

function evaluateTransaction() {
  const amount=Number($('#transactionAmount').value)||0;
  const existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;
  if(transactionType==='income'){
    $('#spendCheck').className='spend-check success';
    const existingAdjustment=existing?(MerCore.transactionType(existing)==='income'?-existing.amount:existing.amount):0;
    $('#spendCheck').innerHTML=`<svg aria-hidden="true"><use href="#icon-up"></use></svg><div><strong>${t('incomeReady')}</strong><span>${amount>0?t('balanceIncrease',{amount:currency(state.availableBalance+existingAdjustment+amount)}):t('enterImpact')}</span></div>`;
    $('#transactionSubmit').disabled=amount<=0;return amount>0;
  }
  const cat=state.categories.find(item=>item.id===$('#transactionCategory').value) || state.categories[0];
  const oldExpense=existing&&MerCore.transactionType(existing)==='expense'&&transactionAffectsCurrentBudget(existing)?existing.amount:0;
  const plan=getPlan();const totalRemaining=Math.max(0,plan.monthlyBudget-(state.spent-oldExpense));
  const categoryRemaining=Math.max(0,cat.limit-cat.spent+(oldExpense&&existing?.category===cat.id?existing.amount:0));
  let level='',title=t('guardReady'),note=t('enterImpact'),blocked=false;
  if(amount>0 && amount>totalRemaining){level='danger';title=t('transactionTotalBlocked');note=t('reduceBy',{amount:currency(amount-totalRemaining)});blocked=true;}
  else if(amount>0 && amount>categoryRemaining){level='danger';title=t('transactionCategoryBlocked');note=t('categoryOnlyLeft',{category:categoryName(cat.id),amount:currency(categoryRemaining)});blocked=true;}
  else if(amount>0){const after=categoryRemaining-amount;const ratio=(cat.spent+amount)/cat.limit;if(ratio>=.85){level='warning';title=t('transactionWarning');note=t('categoryAfter',{amount:currency(after)});}else{level='success';title=t('transactionSafe',{amount:currency(totalRemaining-amount)});note=t('transactionSafeNote');}}
  $('#spendCheck').className=`spend-check ${level}`.trim();
  $('#spendCheck').innerHTML=`<svg aria-hidden="true"><use href="#icon-${blocked?'shield':'check'}"></use></svg><div><strong>${title}</strong><span>${note}</span></div>`;
  $('#transactionSubmit').disabled=blocked;
  return !blocked;
}

function openTransaction(id=null) {
  editingTransactionId=id===null?null:id;$('#transactionForm').reset();
  const existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;
  transactionType=MerCore.transactionType(existing);setTransactionType(transactionType);$('#deleteTransaction').hidden=!existing;
  if(existing){$('#transactionName').value=existing.name;$('#transactionAmount').value=existing.amount;renderCategorySelects();$('#transactionCategory').value=existing.category;evaluateTransaction();}
  openModal($('#transactionModal'));setTimeout(()=>$('#transactionName').focus(),50);
}

function openIncomeTransaction() { editingTransactionId=null;$('#transactionForm').reset();transactionType='income';setTransactionType('income');$('#deleteTransaction').hidden=true;openModal($('#transactionModal'));setTimeout(()=>$('#transactionName').focus(),50); }

function setAssessmentStep(step) {
  assessmentStep=step;
  $$('.assessment-step').forEach(section=>section.classList.toggle('active',Number(section.dataset.step)===step));
  $$('.step-dots span').forEach((dot,index)=>dot.classList.toggle('active',index<step));
  $('#assessmentBack').hidden=step===1; $('#assessmentNext').hidden=step===3; $('#assessmentSave').hidden=step!==3;
  if(step===3)updateRecommendation();
}

function openAssessment() {
  $('#incomeInput').value=state.income; $('#billsInput').value=state.bills; $('#savingsInput').value=state.savingsTarget; $('#savingsBalanceInput').value=state.savingsBalance;
  const radio=$$('input[name="guard"]').find(input=>Number(input.value)===Number(state.guard)); if(radio)radio.checked=true;
  setAssessmentStep(1); openModal($('#assessmentModal'));
}

function updateRecommendation() {
  const income=Number($('#incomeInput').value)||0,bills=Number($('#billsInput').value)||0,savings=Number($('#savingsInput').value)||0,guard=Number($('input[name="guard"]:checked')?.value||.1);
  const budget=income-bills-savings-income*guard;
  $('#recommendedBudget').textContent=t('planPerMonth',{amount:currency(Math.max(0,budget),true)});
  $('#assessmentSave').disabled=budget<state.spent || budget<=0;
  $('.plan-preview').classList.toggle('invalid',budget<state.spent || budget<=0);
}

function scaleCategoryLimits(newBudget) {
  const totalSpent=state.categories.reduce((sum,cat)=>sum+cat.spent,0);
  const totalHeadroom=state.categories.reduce((sum,cat)=>sum+Math.max(0,cat.limit-cat.spent),0);
  if(totalHeadroom<=0)return;
  const availableHeadroom=Math.max(0,newBudget-totalSpent);
  state.categories.forEach(cat=>{const share=Math.max(0,cat.limit-cat.spent)/totalHeadroom;cat.limit=Math.round(cat.spent+availableHeadroom*share);});
}

function openBudgetEditor(id=null) {
  editingCategoryId=id;const cat=id?state.categories.find(item=>item.id===id):null;const plan=getPlan();const allocated=state.categories.reduce((sum,item)=>sum+item.limit,0);const max=cat?cat.limit+Math.max(0,plan.monthlyBudget-allocated):Math.max(0,plan.monthlyBudget-allocated);
  $('#budgetModalTitle').textContent=cat?categoryName(cat.id):t('newCategory');$('#categoryNameInput').value=cat?categoryName(cat.id):'';$('#categoryNameInput').disabled=Boolean(cat&&!cat.isCustom);$('#categoryIconInput').value=cat?(categoryVisual(cat).icon||''):'';$('#categoryIconInput').disabled=Boolean(cat&&!cat.isCustom);$('#budgetLimitInput').value=cat?Math.round(cat.limit):'';$('#budgetLimitInput').min=Math.ceil(cat?.spent||1);$('#budgetLimitInput').max=Math.floor(max);$('#deleteCategory').hidden=!cat?.isCustom;
  $('#budgetModalContext').textContent=cat?t('spentCategory',{spent:currency(cat.spent),max:currency(max,true)}):t('accountIsolation');openModal($('#budgetModal'));setTimeout(()=>$('#categoryNameInput').disabled?$('#budgetLimitInput').select():$('#categoryNameInput').focus(),50);
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

function openSavingsDeposit(id=null) { editingSavingsId=id===null?null:id;const existing=editingSavingsId!==null?(state.savingsEntries||[]).find(entry=>String(entry.id)===String(editingSavingsId)):null;$('#savingsNoteInput').value=existing?.note||(currentLang==='hr'?'Uplata u štednju':'Savings deposit');$('#savingsAmountInput').value=existing?.amount||Math.min(state.savingsTarget,Math.max(1,state.availableBalance-state.bills));$('#savingsModalTitle').textContent=t(existing?'editSavingsEntry':'addToEmergencyFund');$('#savingsSubmit').textContent=t(existing?'updateSavings':'confirmDeposit');$('#deleteSavingsEntry').hidden=!existing;updateSavingsCheck();openModal($('#savingsModal'));setTimeout(()=>$('#savingsNoteInput').focus(),50); }

function updateRecurringPreview() { const day=Number($('#recurringDayInput').value)||1,start=$('#recurringStartInput').value||'2026-08-20';if(day<1||day>31){$('#recurringPreview').textContent=t('recurringInvalidDay');return false;}const next=MerCore.nextOccurrence({day,startDate:start,enabled:true},'2026-08-20',true);$('#recurringPreview').textContent=`${t('nextCharge',{date:formatIsoDate(next)})} ${t('recurringPreview')}`;return true; }
function openRecurring(id=null) { editingRecurringId=id===null?null:id;const existing=editingRecurringId!==null?(state.recurring||[]).find(rule=>String(rule.id)===String(editingRecurringId)):null;renderCategorySelects();$('#recurringModalTitle').textContent=t(existing?'editExpense':'scheduleExpense');$('#recurringNameInput').value=existing?.name||'';$('#recurringAmountInput').value=existing?.amount||'';$('#recurringCategoryInput').value=existing?.category||state.categories[0]?.id;$('#recurringDayInput').value=existing?.day||1;$('#recurringStartInput').value=existing?.startDate||'2026-09-01';$('#deleteRecurring').hidden=!existing;updateRecurringPreview();openModal($('#recurringModal'));setTimeout(()=>$('#recurringNameInput').focus(),50); }

function openIncomeCategoryEditor(id=null) {
  editingIncomeCategoryId=id;const cat=id?state.incomeCategories.find(item=>item.id===id):null;if(cat&&!cat.isCustom)return;
  $('#incomeCategoryModalTitle').textContent=cat?incomeCategoryName(cat.id):t('newIncomeCategory');$('#incomeCategoryNameInput').value=cat?incomeCategoryName(cat.id):'';$('#incomeCategoryIconInput').value=cat?.icon||'';$('#deleteIncomeCategory').hidden=!cat;openModal($('#incomeCategoryModal'));setTimeout(()=>$('#incomeCategoryNameInput').focus(),50);
}

$$('[data-close-modal]').forEach(button=>button.addEventListener('click',()=>closeModal(button.closest('dialog'))));
$$('.modal').forEach(modal=>modal.addEventListener('cancel',event=>{event.preventDefault();closeModal(modal);}));
$('#modalBackdrop').addEventListener('click',()=>closeModal($('dialog[open]')));
$$('[data-open-transaction]').forEach(button=>button.addEventListener('click',()=>openTransaction()));
$$('[data-open-income]').forEach(button=>button.addEventListener('click',openIncomeTransaction));
$$('[data-open-assessment]').forEach(button=>button.addEventListener('click',openAssessment));
$$('[data-open-savings]').forEach(button=>button.addEventListener('click',()=>openSavingsDeposit()));
$('#openSettings').addEventListener('click',event=>{event.stopPropagation();toggleAccountMenu();closeNotifications();}); $('#openPlan').addEventListener('click',()=>openModal($('#breakdownModal'))); $('#safeBreakdown').addEventListener('click',()=>openModal($('#breakdownModal')));
$('#manageBanks').addEventListener('click',openBankSettings);
$('#startBankConnection').addEventListener('click',()=>{selectedBankProviderId=null;$('#bankProfileSelect').value=appState.activeAccount;$('#bankConnectForm').hidden=false;$('#bankAccountPicker').hidden=true;$('#bankProfileLabel').hidden=true;$('#bankConsentCopy').hidden=true;$('#connectSelectedAccounts').hidden=true;renderProviderPicker();});
$('#cancelBankConnection').addEventListener('click',()=>{selectedBankProviderId=null;$('#bankConnectForm').hidden=true;});
$('#bankConnectForm').addEventListener('submit',connectSelectedBankAccounts);
$('#syncNow').addEventListener('click',()=>syncActiveBankConnections());
$('#uncategorizedBadge').addEventListener('click',()=>{activityReviewOnly=true;showView('activity');renderActivity();});
$('#clearReviewFilter').addEventListener('click',()=>{activityReviewOnly=false;renderActivity();});
$('#settingsExportCsv').addEventListener('click',exportCsv);
$('#addCategory').addEventListener('click',()=>openBudgetEditor());
$('#addRecurring').addEventListener('click',()=>openRecurring());
$('#addIncomeCategory').addEventListener('click',()=>openIncomeCategoryEditor());
$('#themeToggle').addEventListener('click',toggleTheme);$$('[data-account]').forEach(button=>button.addEventListener('click',()=>switchAccount(button.dataset.account)));$('#exportCsv').addEventListener('click',exportCsv);
$('#notificationButton').addEventListener('click',event=>{event.stopPropagation();toggleNotifications();});$('#closeNotifications').addEventListener('click',closeNotifications);
$$('[data-tooltip-key]').forEach(trigger=>{trigger.addEventListener('mouseenter',()=>showTooltip(trigger));trigger.addEventListener('mouseleave',hideTooltip);trigger.addEventListener('focus',()=>showTooltip(trigger));trigger.addEventListener('blur',hideTooltip);trigger.addEventListener('click',()=>$('#appTooltip').hidden?showTooltip(trigger):hideTooltip());});
document.addEventListener('click',event=>{if(!event.target.closest('.sidebar-bottom'))toggleAccountMenu(false);if(!event.target.closest('.notification-wrap'))closeNotifications();});
$$('.nav-item').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
$$('[data-go-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.goView)));
$('[data-home]').addEventListener('click',event=>{event.preventDefault();showView('overview');});
$$('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
$('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.contains('open')?closeSidebar():openSidebar()); $('#sidebarScrim').addEventListener('click',closeSidebar);

$('#transactionAmount').addEventListener('input',evaluateTransaction); $('#transactionCategory').addEventListener('change',evaluateTransaction);
$$('[data-transaction-type]').forEach(button=>button.addEventListener('click',()=>setTransactionType(button.dataset.transactionType)));
$('#transactionForm').addEventListener('submit',event=>{event.preventDefault();if(!evaluateTransaction()){showToast(t(transactionType==='income'?'enterImpact':'transactionBlocked'));return;}const amount=Number($('#transactionAmount').value),category=$('#transactionCategory').value,existing=editingTransactionId!==null?state.transactions.find(tx=>String(tx.id)===String(editingTransactionId)):null;if(existing)applyTransactionEffect(existing,-1);const payload={type:transactionType,name:$('#transactionName').value.trim(),amount,category,date:existing?.date||'2026-08-20T12:00:00'};if(existing){Object.assign(existing,payload);if(existing.sourceType==='auto'){existing.needsReview=false;existing.categoryConfidence='manual';}applyTransactionEffect(existing,1);}else{const created={id:Date.now(),...payload,source:'Manual',sourceType:'manual',needsReview:false};state.transactions.unshift(created);applyTransactionEffect(created,1);}save();renderAll();closeModal($('#transactionModal'));showToast(existing?.sourceType==='auto'?t('categoryApproved'):t(transactionType==='income'?(existing?'incomeUpdated':'incomeAdded'):(existing?'expenseUpdated':'transactionAdded')));editingTransactionId=null;});
$('#deleteTransaction').addEventListener('click',()=>{const existing=state.transactions.find(tx=>String(tx.id)===String(editingTransactionId));if(!existing)return;const type=MerCore.transactionType(existing);applyTransactionEffect(existing,-1);state.transactions=state.transactions.filter(tx=>String(tx.id)!==String(editingTransactionId));save();renderAll();closeModal($('#transactionModal'));showToast(t(type==='income'?'incomeDeleted':'expenseDeleted'));editingTransactionId=null;});

$('#assessmentNext').addEventListener('click',()=>{const active=$(`.assessment-step[data-step="${assessmentStep}"]`);const inputs=$$('input[required]',active);if(!inputs.every(input=>input.reportValidity()))return;if(assessmentStep===1&&Number($('#incomeInput').value)<=Number($('#billsInput').value)){showToast(t('planInvalid'));return;}setAssessmentStep(Math.min(3,assessmentStep+1));});
$('#assessmentBack').addEventListener('click',()=>setAssessmentStep(Math.max(1,assessmentStep-1)));
$$('#assessmentForm input').forEach(input=>input.addEventListener('input',()=>{if(assessmentStep===3)updateRecommendation();}));
$('#assessmentForm').addEventListener('submit',event=>{event.preventDefault();const income=Number($('#incomeInput').value),bills=Number($('#billsInput').value),savings=Number($('#savingsInput').value),balance=Number($('#savingsBalanceInput').value),guard=Number($('input[name="guard"]:checked').value);const newBudget=income-bills-savings-income*guard;if(newBudget<state.spent||newBudget<=0){showToast(t('planInvalid'));return;}state.income=income;state.bills=bills;state.savingsTarget=savings;state.savingsBalance=balance;state.guard=guard;const allocated=state.categories.reduce((sum,cat)=>sum+cat.limit,0);if(allocated>newBudget)scaleCategoryLimits(newBudget);save();renderAll();closeModal($('#assessmentModal'));showToast(t('planReady'));});

$('#budgetForm').addEventListener('submit',event=>{event.preventDefault();const cat=editingCategoryId?state.categories.find(item=>item.id===editingCategoryId):null,name=$('#categoryNameInput').value.trim(),value=Number($('#budgetLimitInput').value),plan=getPlan(),otherAllocated=state.categories.reduce((sum,item)=>sum+item.limit,0)-(cat?.limit||0),validation=MerCore.validateCategoryLimit(value,cat?.spent||0,otherAllocated,plan.monthlyBudget);if(!name){showToast(t('categoryNameRequired'));return;}if(state.categories.some(item=>item.id!==editingCategoryId&&categoryName(item.id).toLocaleLowerCase(locale())===name.toLocaleLowerCase(locale()))){showToast(t('duplicateCategory'));return;}if(!validation.valid){showToast(t(validation.reason==='below-spent'?'limitTooLow':'allocationTooHigh'));return;}if(cat){if(cat.isCustom){cat.name=name;cat.icon=$('#categoryIconInput').value.trim().slice(0,2)||name.slice(0,1).toUpperCase();}cat.limit=value;}else{state.categories.push({id:`custom-${Date.now()}`,name,icon:$('#categoryIconInput').value.trim().slice(0,2)||name.slice(0,1).toUpperCase(),spent:0,limit:value,isCustom:true});}save();renderAll();closeModal($('#budgetModal'));showToast(t(cat?'categoryUpdated':'categoryCreated'));});
$('#deleteCategory').addEventListener('click',()=>{const cat=state.categories.find(item=>item.id===editingCategoryId);if(!cat?.isCustom)return;const fallback=fallbackCategory(cat.id);fallback.spent+=cat.spent;fallback.limit+=cat.limit;state.transactions.forEach(tx=>{if(tx.category===cat.id)tx.category=fallback.id;});(state.recurring||[]).forEach(rule=>{if(rule.category===cat.id)rule.category=fallback.id;});state.categories=state.categories.filter(item=>item.id!==cat.id);save();renderAll();closeModal($('#budgetModal'));showToast(t('categoryDeleted'));editingCategoryId=null;});

$('#savingsAmountInput').addEventListener('input',updateSavingsCheck);
$('#savingsForm').addEventListener('submit',event=>{event.preventDefault();if(!updateSavingsCheck())return;const amount=Number($('#savingsAmountInput').value),note=$('#savingsNoteInput').value.trim(),existing=editingSavingsId!==null?(state.savingsEntries||[]).find(entry=>String(entry.id)===String(editingSavingsId)):null,difference=amount-(existing?.amount||0);state.savingsBalance+=difference;state.availableBalance-=difference;state.savingsHistory[state.savingsHistory.length-1]+=difference;if(existing){existing.amount=amount;existing.note=note;}else{state.savingsEntries=state.savingsEntries||[];state.savingsEntries.push({id:`s-${Date.now()}`,amount,note,date:'2026-08-20T12:00:00'});}save();renderAll();closeModal($('#savingsModal'));showToast(t(existing?'savingsUpdated':'depositAdded',{amount:currency(amount,true)}));editingSavingsId=null;});
$('#deleteSavingsEntry').addEventListener('click',()=>{const existing=(state.savingsEntries||[]).find(entry=>String(entry.id)===String(editingSavingsId));if(!existing)return;state.savingsBalance=Math.max(0,state.savingsBalance-existing.amount);state.availableBalance+=existing.amount;state.savingsHistory[state.savingsHistory.length-1]=Math.max(0,state.savingsHistory[state.savingsHistory.length-1]-existing.amount);state.savingsEntries=state.savingsEntries.filter(entry=>String(entry.id)!==String(editingSavingsId));save();renderAll();closeModal($('#savingsModal'));showToast(t('savingsDeleted'));editingSavingsId=null;});

$('#recurringDayInput').addEventListener('input',updateRecurringPreview);$('#recurringStartInput').addEventListener('input',updateRecurringPreview);
$('#recurringForm').addEventListener('submit',event=>{event.preventDefault();if(!updateRecurringPreview())return;const payload={name:$('#recurringNameInput').value.trim(),amount:Number($('#recurringAmountInput').value),category:$('#recurringCategoryInput').value,day:Number($('#recurringDayInput').value),startDate:$('#recurringStartInput').value,enabled:true};if(!payload.name||!Number.isFinite(payload.amount)||payload.amount<=0||payload.day<1||payload.day>31){showToast(t('recurringInvalidDay'));return;}const existing=editingRecurringId!==null?(state.recurring||[]).find(rule=>String(rule.id)===String(editingRecurringId)):null;if(existing)Object.assign(existing,payload);else{state.recurring=state.recurring||[];state.recurring.push({id:`r-${Date.now()}`,...payload,lastProcessed:null});}save();renderAll();closeModal($('#recurringModal'));showToast(t('recurringSaved'));editingRecurringId=null;});
$('#deleteRecurring').addEventListener('click',()=>{state.recurring=(state.recurring||[]).filter(rule=>String(rule.id)!==String(editingRecurringId));save();renderAll();closeModal($('#recurringModal'));showToast(t('recurringDeleted'));editingRecurringId=null;});

$('#incomeCategoryForm').addEventListener('submit',event=>{event.preventDefault();const existing=editingIncomeCategoryId?state.incomeCategories.find(item=>item.id===editingIncomeCategoryId):null;const name=$('#incomeCategoryNameInput').value.trim();if(!name){showToast(t('categoryNameRequired'));return;}if(state.incomeCategories.some(item=>item.id!==editingIncomeCategoryId&&incomeCategoryName(item.id).toLocaleLowerCase(locale())===name.toLocaleLowerCase(locale()))){showToast(t('duplicateCategory'));return;}const icon=$('#incomeCategoryIconInput').value.trim().slice(0,2)||name.slice(0,1).toUpperCase();if(existing){existing.name=name;existing.icon=icon;}else state.incomeCategories.push({id:`income-${Date.now()}`,name,icon,isCustom:true});save();renderAll();closeModal($('#incomeCategoryModal'));showToast(t(existing?'incomeCategoryUpdated':'incomeCategoryCreated'));editingIncomeCategoryId=null;});
$('#deleteIncomeCategory').addEventListener('click',()=>{const existing=state.incomeCategories.find(item=>item.id===editingIncomeCategoryId);if(!existing?.isCustom)return;let fallback=state.incomeCategories.find(item=>item.id==='otherIncome');if(!fallback){fallback=structuredClone(defaultIncomeCategories.find(item=>item.id==='otherIncome'));state.incomeCategories.push(fallback);}state.transactions.forEach(tx=>{if(MerCore.transactionType(tx)==='income'&&tx.category===existing.id)tx.category=fallback.id;});state.incomeCategories=state.incomeCategories.filter(item=>item.id!==existing.id);save();renderAll();closeModal($('#incomeCategoryModal'));showToast(t('incomeCategoryDeleted'));editingIncomeCategoryId=null;});

$('#activitySearch').addEventListener('input',renderActivity); $('#activityFilter').addEventListener('change',renderActivity);$('#activityTypeFilter').addEventListener('change',renderActivity);
$$('#insightsFilters [data-timeframe]').forEach(button=>button.addEventListener('click',()=>{insightsTimeframe=button.dataset.timeframe;renderInsights();}));
$('#prevMonth').addEventListener('click',()=>{if(activeMonth>0){activeMonth--;renderMonth();showToast(t('historyUnavailable'));}}); $('#nextMonth').addEventListener('click',()=>{if(activeMonth<7){activeMonth++;renderMonth();showToast(t('viewingMonth',{month:$('#monthLabel').textContent}));}});
window.addEventListener('resize',()=>{if(window.innerWidth>800)closeSidebar();});

function syncBanksIfStale(){const stale=bankConnectionsFor().some(connection=>!connection.lastSyncedAt||Date.now()-new Date(connection.lastSyncedAt).getTime()>=300000);if(stale)syncActiveBankConnections({silent:true});}

processDueRecurring(state);applyStaticTranslations();applyTheme();renderAll();showView(activeView);save();
setTimeout(syncBanksIfStale,1200);setInterval(()=>syncActiveBankConnections({silent:true}),300000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncBanksIfStale();});

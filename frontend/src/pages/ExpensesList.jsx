import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { expenseService, houseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DesktopExpensesView from '../layouts/desktop/DesktopExpensesView'
import { exportExpensesPdf } from '../utils/pdfExport'
import { createMemberMap, getMemberById } from '../utils/expenseMembers'
import { filterExpensesByDateRange, filterRentHistoryByDateRange } from '../utils/filters/expenseFilters'
import { EXPENSE_CATEGORIES } from '../constants/categories'
import ExpenseFilterBar from '../components/expenses/ExpenseFilterBar'
import ExpenseSummaryCards from '../components/expenses/ExpenseSummaryCards'
import ExpenseCategoryTabs from '../components/expenses/ExpenseCategoryTabs'
import ExpenseTransactionCard from '../components/expenses/ExpenseTransactionCard'
import ExpenseDateRangeFilters from '../components/expenses/ExpenseDateRangeFilters'
import ExpenseLoadingList from '../components/expenses/ExpenseLoadingList'
import ExpenseEmptyState from '../components/expenses/ExpenseEmptyState'
import ExpenseRentHistorySection from '../components/expenses/ExpenseRentHistorySection'
import ExpenseErrorState from '../components/expenses/ExpenseErrorState'
import ThemeCustomizer from '../components/ThemeCustomizer'
import { getErrorMessage } from '../utils/apiError'

export default function ExpensesList() {
  const navigate = useNavigate()
  const { members } = useHouse()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch]       = useState('')
  const [expenseFromDate, setExpenseFromDate] = useState('')
  const [expenseToDate, setExpenseToDate] = useState('')
  const [rentFromDate, setRentFromDate] = useState('')
  const [rentToDate, setRentToDate] = useState('')
  const preferredCurrency = user?.currency || 'LKR'

  const { data, isLoading, error, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', activeTab, search],
    queryFn: () => expenseService.getAll({
      category: activeTab === 'All' ? undefined : activeTab,
      search:   search || undefined,
    }).then(r => r.data),
  })

  const { data: summaryData, error: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => expenseService.summary().then(r => r.data),
  })

  const { data: rentHistoryData, error: rentHistoryError, refetch: refetchRentHistory } = useQuery({
    queryKey: ['rent-history'],
    queryFn: () => houseService.getRentHistory().then(r => r.data),
  })

  const memberMap = useMemo(() => createMemberMap(members), [members])
  const filteredExpenses = useMemo(
    () => filterExpensesByDateRange(data?.expenses, expenseFromDate, expenseToDate),
    [data?.expenses, expenseFromDate, expenseToDate],
  )
  const filteredRentHistory = useMemo(
    () => filterRentHistoryByDateRange(rentHistoryData?.history, rentFromDate, rentToDate),
    [rentHistoryData?.history, rentFromDate, rentToDate],
  )
  const pageError = error || summaryError || rentHistoryError

  const exportPdf = () => {
    exportExpensesPdf({
      summaryData,
      expenses: filteredExpenses,
      rentHistory: filteredRentHistory,
      currency: preferredCurrency,
      expenseFromDate,
      expenseToDate,
      rentFromDate,
      rentToDate,
    })
  }

  if (pageError) {
    return (
      <ExpenseErrorState
        title="Unable to load expenses"
        message={getErrorMessage(pageError)}
        onRetry={() => Promise.all([refetchExpenses(), refetchSummary(), refetchRentHistory()])}
      />
    )
  }

  return (
    <>
      <div className="hidden lg:block">
        <DesktopExpensesView
          members={members}
          expenses={filteredExpenses}
          rentHistory={filteredRentHistory}
          summaryData={summaryData}
          currency={preferredCurrency}
          onAdd={() => navigate('/expenses/add')}
          categories={EXPENSE_CATEGORIES}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          expenseFromDate={expenseFromDate}
          expenseToDate={expenseToDate}
          onExpenseFromDateChange={setExpenseFromDate}
          onExpenseToDateChange={setExpenseToDate}
          rentFromDate={rentFromDate}
          rentToDate={rentToDate}
          onRentFromDateChange={setRentFromDate}
          onRentToDateChange={setRentToDate}
        />
      </div>

      <div className="lg:hidden bg-surface app-light-gradient font-body text-on-surface min-h-screen pb-32">
        <TopBar />

      <main className="max-w-screen-xl mx-auto px-6 pt-4 pb-32">
        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Expenses</h1>
          <p className="text-on-surface-variant font-medium">Keep track of your shared living costs.</p>
        </section>

        {/* Search + filter */}
        <ExpenseFilterBar
          search={search}
          onSearchChange={setSearch}
          onExport={exportPdf}
          onAdd={() => navigate('/expenses/add')}
        />

        {/* Summary bento */}
        <ExpenseSummaryCards
          totalExpenses={summaryData?.totalExpenses || 0}
          myShare={summaryData?.myShare || 0}
          currency={preferredCurrency}
        />

        {/* Category tabs */}
        <ExpenseCategoryTabs categories={EXPENSE_CATEGORIES} activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Expense list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 px-1">Recent Transactions</h3>

          <div className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <ExpenseDateRangeFilters
              fromValue={expenseFromDate}
              toValue={expenseToDate}
              onFromChange={setExpenseFromDate}
              onToChange={setExpenseToDate}
              wrapperClassName="grid grid-cols-1 sm:grid-cols-2 gap-2"
              labelClassName="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1"
              inputClassName="w-full bg-white rounded-xl px-3 py-2 text-sm border border-outline-variant/20"
              fromAriaLabel="Filter expenses from date"
              toAriaLabel="Filter expenses to date"
            />
          </div>

          {isLoading && <ExpenseLoadingList />}

          {!isLoading && filteredExpenses.length === 0 && (
            <ExpenseEmptyState
              icon="receipt_long"
              title="No expenses found"
              actionLabel="+ Add First Expense"
              onAction={() => navigate('/expenses/add')}
            />
          )}

          {filteredExpenses.map(exp => {
            const payer = getMemberById(memberMap, exp.paidBy)
            return (
              <ExpenseTransactionCard
                key={exp._id}
                expense={exp}
                currency={preferredCurrency}
                payerName={payer?.name || payer?.displayName || 'Unknown'}
                onClick={(expenseId) => navigate(`/expenses/${expenseId}`)}
              />
            )
          })}
        </div>

        <ExpenseRentHistorySection
          rentHistory={filteredRentHistory}
          currency={preferredCurrency}
          rentFromDate={rentFromDate}
          rentToDate={rentToDate}
          onRentFromDateChange={setRentFromDate}
          onRentToDateChange={setRentToDate}
        />
      </main>

        <BottomNav />
                <ThemeCustomizer />
      </div>
    </>
  )
}


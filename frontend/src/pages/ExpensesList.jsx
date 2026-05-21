import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { expenseService, houseService } from '../services'
import { useHouse } from '../context/HouseContext'
import { useAuth } from '../context/AuthContext'
import TopBar from '../components/navigation/TopBar'
import BottomNav from '../components/navigation/BottomNav'
import DesktopExpensesView from '../layouts/desktop/DesktopExpensesView'
import NoHouseState from '../components/common/NoHouseState'
import { exportExpensesPdf } from '../utils/pdfExport'
import { createMemberMap, getMemberById } from '../utils/expenseMembers'
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
import ThemeCustomizer from '../components/common/ThemeCustomizer'
import { getErrorMessage } from '../utils/apiError'

export default function ExpensesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { house, members, loading: houseLoading, error: houseError } = useHouse()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [expenseFromDate, setExpenseFromDate] = useState('')
  const [expenseToDate, setExpenseToDate] = useState('')
  const [rentFromDate, setRentFromDate] = useState('')
  const [rentToDate, setRentToDate] = useState('')
  const [rentPage, setRentPage] = useState(1)
  const [rentPageSize, setRentPageSize] = useState(10)
  const preferredCurrency = user?.currency || 'LKR'
  const isHouseBootstrapping = !!user && !house && !houseError && houseLoading
  const isNoHouse = !!user && !house && (!houseError || houseError.response?.status === 404)

  const getVisiblePages = (current, total, maxButtons = 3) => {
    const safeTotal = Math.max(1, total || 1)
    const safeCurrent = Math.min(Math.max(1, current || 1), safeTotal)
    const buttonCount = Math.min(maxButtons, safeTotal)
    const start = Math.max(1, Math.min(safeCurrent - Math.floor(buttonCount / 2), safeTotal - buttonCount + 1))
    return Array.from({ length: buttonCount }, (_, index) => start + index)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [activeTab, debouncedSearch, expenseFromDate, expenseToDate])

  useEffect(() => {
    setRentPage(1)
  }, [rentFromDate, rentToDate])

  const { data, isLoading, error, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', activeTab, debouncedSearch, page, pageSize, expenseFromDate, expenseToDate],
    queryFn: () => expenseService.getAll({
      category: activeTab === 'All' ? undefined : activeTab,
      search:   debouncedSearch || undefined,
      page,
      limit: pageSize,
      from: expenseFromDate || undefined,
      to: expenseToDate || undefined,
    }).then(r => r.data),
    enabled: !!house,
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  const { data: summaryData, error: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => expenseService.summary().then(r => r.data),
    enabled: !!house,
  })

  const { data: rentHistoryData, error: rentHistoryError, refetch: refetchRentHistory } = useQuery({
    queryKey: ['rent-history', rentPage, rentPageSize, rentFromDate, rentToDate],
    queryFn: () => houseService.getRentHistory({
      page: rentPage,
      limit: rentPageSize,
      from: rentFromDate || undefined,
      to: rentToDate || undefined,
    }).then(r => r.data),
    enabled: !!house,
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    const totalPages = Number(data?.pages || 1)
    const nextPage = page + 1
    if (nextPage > totalPages) return

    queryClient.prefetchQuery({
      queryKey: ['expenses', activeTab, debouncedSearch, nextPage, pageSize, expenseFromDate, expenseToDate],
      queryFn: () => expenseService.getAll({
        category: activeTab === 'All' ? undefined : activeTab,
        search: debouncedSearch || undefined,
        page: nextPage,
        limit: pageSize,
        from: expenseFromDate || undefined,
        to: expenseToDate || undefined,
      }).then(r => r.data),
      staleTime: 30 * 1000,
    })
  }, [queryClient, data?.pages, page, activeTab, debouncedSearch, pageSize, expenseFromDate, expenseToDate])

  useEffect(() => {
    const totalPages = Number(rentHistoryData?.pages || 1)
    const nextPage = rentPage + 1
    if (nextPage > totalPages) return

    queryClient.prefetchQuery({
      queryKey: ['rent-history', nextPage, rentPageSize, rentFromDate, rentToDate],
      queryFn: () => houseService.getRentHistory({
        page: nextPage,
        limit: rentPageSize,
        from: rentFromDate || undefined,
        to: rentToDate || undefined,
      }).then(r => r.data),
      staleTime: 30 * 1000,
    })
  }, [queryClient, rentHistoryData?.pages, rentPage, rentPageSize, rentFromDate, rentToDate])

  const memberMap = useMemo(() => createMemberMap(members), [members])
  const filteredExpenses = useMemo(() => data?.expenses || [], [data?.expenses])
  const filteredRentHistory = useMemo(() => rentHistoryData?.history || [], [rentHistoryData?.history])
  const pageError = error || summaryError || rentHistoryError

  const noHouseView = (
    <NoHouseState
      desktopPageTitle="Expenses"
      desktopSubtitle="You are not connected to a home yet"
    />
  )

  if (isHouseBootstrapping) {
    return (
      <div className="min-h-screen grid place-items-center bg-surface app-light-gradient font-body text-on-surface px-6">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span className="font-medium">Loading your home...</span>
        </div>
      </div>
    )
  }

  if (isNoHouse) {
    return noHouseView
  }

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
          expenses={data?.expenses || []}
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
          onViewDetail={(id) => navigate(`/expenses/${id}`)}
          page={data?.page || page}
          pages={data?.pages || 1}
          onPageChange={(p) => setPage(p)}
          rentPage={rentHistoryData?.page || rentPage}
          rentPages={rentHistoryData?.pages || 1}
          onRentPageChange={(p) => setRentPage(p)}
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
          {/* Mobile pagination */}
          {data?.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl bg-surface-container text-sm font-semibold border border-outline-variant/30 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-surface-container-high transition"
              >
                Prev
              </button>
              {getVisiblePages(data?.page || page, data?.pages || 1, 3).map(pageNumber => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`min-w-9 px-3 py-1.5 rounded-xl text-sm font-semibold border transition ${
                    (data?.page || page) === pageNumber
                      ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20'
                      : 'bg-surface-container text-on-surface border-outline-variant/30 hover:bg-surface-container-high'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(data?.pages || 1, p + 1))}
                disabled={page >= data?.pages}
                className="px-3 py-1.5 rounded-xl bg-surface-container text-sm font-semibold border border-outline-variant/30 disabled:opacity-45 disabled:cursor-not-allowed hover:bg-surface-container-high transition"
              >
                Next
              </button>
              <div className="text-sm text-slate-600 w-full text-center mt-1">Page {data?.page} of {data?.pages}</div>
            </div>
          )}
        </div>

        <ExpenseRentHistorySection
          rentHistory={filteredRentHistory}
          currency={preferredCurrency}
          rentFromDate={rentFromDate}
          rentToDate={rentToDate}
          onRentFromDateChange={setRentFromDate}
          onRentToDateChange={setRentToDate}
          page={rentPage}
          pages={rentHistoryData?.pages || 1}
          onPageChange={setRentPage}
        />
      </main>

        <BottomNav />
                <ThemeCustomizer />
      </div>
    </>
  )
}


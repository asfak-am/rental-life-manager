export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong'

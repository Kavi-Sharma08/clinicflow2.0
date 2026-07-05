type UserNameParts = {
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  email?: string | null
}

export const getUserDisplayName = (user: UserNameParts): string => {
  const name = [user.firstName, user.middleName, user.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim()

  return name || user.email || 'ClinicFlow User'
}

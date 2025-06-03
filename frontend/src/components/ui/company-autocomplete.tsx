"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Company {
  id: string
  name: string
  domain?: string
  logo?: string
  industry?: string
  size?: string
}

interface CompanyAutocompleteProps {
  value?: string
  onSelect?: (company: Company | null) => void
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Debounce hook to limit API calls
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function CompanyAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = "Search companies...",
  disabled = false,
  className,
}: CompanyAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null)
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Debounce search value to reduce API calls
  const debouncedSearchValue = useDebounce(searchValue, 500)

  // API function to search companies
  const searchCompanies = async (query: string): Promise<Company[]> => {
    try {
      setError(null)
      
      if (!query || query.length < 2) {
        return []
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/companies/search?q=${encodeURIComponent(query)}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Company search error:', error)
      setError(error instanceof Error ? error.message : 'Failed to search companies')
      return []
    }
  }

  // Fetch companies when debounced search value changes
  React.useEffect(() => {
    const loadCompanies = async () => {
      if (!debouncedSearchValue || debouncedSearchValue.length < 2) {
        setCompanies([])
        return
      }

      setIsLoading(true)
      try {
        const results = await searchCompanies(debouncedSearchValue)
        setCompanies(results)
      } catch (error) {
        console.error('Failed to load companies:', error)
        setCompanies([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCompanies()
  }, [debouncedSearchValue])

  // Update selected company when value changes
  React.useEffect(() => {
    if (value) {
      // First check if we already have this company in our current companies list
      const company = companies.find(c => c.name === value)
      if (company) {
        // Found a company with full data (including logo and domain)
        setSelectedCompany(company)
      } else if (!selectedCompany || selectedCompany.name !== value) {
        // If not found in current list but we have a value, create a custom company
        setSelectedCompany({ id: 'custom', name: value })
      }
    } else if (!value && selectedCompany) {
      // Only clear if value is explicitly empty and we have a selected company
      setSelectedCompany(null)
    }
  }, [value, companies])

  const handleSelect = (company: Company) => {
    setSelectedCompany(company)
    setOpen(false)
    setSearchValue("")
    // Store the selected company to prevent it from being lost
    setCompanies(prev => {
      const exists = prev.find(c => c.id === company.id)
      return exists ? prev : [company, ...prev]
    })
    // Only call onSelect when selecting from dropdown
    // onChange is for manual typing only
    onSelect?.(company)
  }

  const handleCustomInput = (inputValue: string) => {
    if (inputValue) {
      const customCompany: Company = {
        id: 'custom',
        name: inputValue
      }
      handleSelect(customCompany)
    }
  }

  // Handle blur event to capture manual input
  const handleInputBlur = () => {
    if (searchValue && searchValue.trim()) {
      handleCustomInput(searchValue.trim())
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !selectedCompany && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCompany ? (
              <>
                {selectedCompany.logo ? (
                  <div className="relative">
                    <img
                      src={selectedCompany.logo}
                      alt={`${selectedCompany.name} logo`}
                      className="w-5 h-5 rounded-sm flex-shrink-0 object-contain"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        // Show fallback building icon
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'block'
                      }}
                    />
                    <Building className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden" />
                  </div>
                ) : (
                  <Building className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="truncate font-medium">{selectedCompany.name}</span>
              </>
            ) : (
              <>
                <Building className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span>{placeholder}</span>
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type to search companies..."
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchValue) {
                handleCustomInput(searchValue)
              }
            }}
          />
          <CommandList>
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Searching companies...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <p className="text-sm text-red-600 mb-2">Search failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                {searchValue && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to add "{searchValue}" manually
                  </p>
                )}
              </div>
            ) : companies.length === 0 && searchValue.length >= 2 ? (
              <CommandEmpty>
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">No companies found</p>
                  {searchValue && (
                    <p className="text-xs text-muted-foreground">
                      Press Enter to add "{searchValue}" as a custom company
                    </p>
                  )}
                </div>
              </CommandEmpty>
            ) : searchValue.length < 2 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            ) : (
              <CommandGroup>
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => handleSelect(company)}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={`${company.name} logo`}
                          className="w-8 h-8 rounded-md flex-shrink-0"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{company.name}</p>
                        {(company.industry || company.size) && (
                          <p className="text-sm text-muted-foreground truncate">
                            {company.industry}
                            {company.industry && company.size && ' • '}
                            {company.size}
                          </p>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedCompany?.name === company.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

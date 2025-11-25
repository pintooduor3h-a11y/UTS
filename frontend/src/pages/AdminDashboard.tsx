import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StorageUploader, WalletClient } from '@bsv/sdk'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import './AdminDashboard.css'

interface TokenData {
  contractType: string
  contractPointer: string
  fiatDenomination?: string
  numShares: string
  issueDate: string
  contractDuration?: string
  id: string
  fileHash: string
  peggingRate: string
  shareValue: string
  id2: string
  transactionType: string
}

function AdminDashboard() {
  const navigate = useNavigate()

  // Form state - Based on Fiat Currency metadata format
  const [contractType, setContractType] = useState('0x00000001') // Indicates Fiat Currency
  const [contractPointer, setContractPointer] = useState('')
  const [fiatDenomination, setFiatDenomination] = useState('CAD') // Currency code for Fiat Currency
  const [numShares, setNumShares] = useState('1000') // Number of shares
  const [sliderValue, setSliderValue] = useState(1) // Slider position (0-5 for 0, 1k, 1M, 1B, 1T, 1Q)
  const [peggingRate, setPeggingRate] = useState('1') // BTC/fiat pegging rate
  const [shareValue, setShareValue] = useState('1.00') // Share value (positive real numbers only)
  const [transactionType, setTransactionType] = useState('0x01') // Issuance/payment/redemption
  const [contractDuration, setContractDuration] = useState('') // Duration for non-fiat currency contracts
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileHash, setFileHash] = useState<string>('')
  const [uploadingFile, setUploadingFile] = useState(false)

  // State to track created tokens
  const [createdTokens, setCreatedTokens] = useState<TokenData[]>([])

  // Calculated fees
  const baseIssuerFee = 12.00
  const oneTimeFees = (parseFloat(numShares) || 0) * 40
  const issuerOpsFees = 0.00
  const totalPerCoupon = 0.00
  const pricePerThousand = 40000

  const handleLogout = () => {
    navigate('/')
  }

  const formatCurrency = (value: number) => {
    return value.toFixed(2)
  }

  const getSliderLabel = (value: number) => {
    const labels = ['0', '1k', '1M', '1B', '1T', '1Q']
    return labels[value] || '0'
  }

  // Convert slider value to actual number
  const sliderToNumber = (value: number): number => {
    const multipliers = [0, 1000, 1000000, 1000000000, 1000000000000, 1000000000000000]
    return multipliers[value] || 0
  }

  // Handle slider change
  const handleSliderChange = (value: number) => {
    setSliderValue(value)
    setNumShares(sliderToNumber(value).toString())
  }

  // Handle numShares input change
  const handleNumSharesChange = (value: string) => {
    setNumShares(value)
    // Try to match to nearest slider position
    const num = parseInt(value) || 0
    if (num === 0) setSliderValue(0)
    else if (num < 500000) setSliderValue(1)
    else if (num < 500000000) setSliderValue(2)
    else if (num < 500000000000) setSliderValue(3)
    else if (num < 500000000000000) setSliderValue(4)
    else setSliderValue(5)
  }

  // Get contract type label for display
  const getContractTypeLabel = () => {
    switch (contractType) {
      case '0x00000001':
        return 'currency'
      case '0x00000002':
        return 'bond'
      case '0x00000003':
        return 'ticket'
      case '0x00000004':
        return 'coupon'
      default:
        return 'item'
    }
  }

  // Get contract type details including SVG icon
  const getContractTypeDetails = (type: string) => {
    switch (type) {
      case '0x00000001':
        return { label: 'Fiat Currency', icon: '/money-simple.svg' }
      case '0x00000002':
        return { label: 'Government Bond', icon: '/Government Bonds Label.svg' }
      case '0x00000003':
        return { label: 'Theater Ticket', icon: '/Theater-Tickets.svg' }
      case '0x00000004':
        return { label: 'Coupon', icon: '/coupon.svg' }
      default:
        return { label: 'Unknown', icon: '/money-simple.svg' }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadingFile(true)
      setFileHash('')

      try {
        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer()
        const fileData = new Uint8Array(arrayBuffer)

        // Create WalletClient instance - this will use the browser wallet
        let wallet
        try {
          wallet = new WalletClient()
          console.log('Wallet connected successfully')
        } catch (walletError) {
          console.error('Failed to connect to wallet:', walletError)
          setFileHash('Wallet connection failed')
          setUploadingFile(false)
          return
        }

        // Upload to distributed storage using StorageUploader
        // Admin will pay for the storage through their connected wallet
        const uploader = new StorageUploader({
          storageURL: 'https://nanostore.babbage.systems',
          wallet: wallet
        })

        console.log('Uploading file to distributed storage...')
        const result = await uploader.publishFile({
          file: {
            data: fileData,
            type: file.type || 'application/octet-stream'
          },
          retentionPeriod: 60 * 24 * 7 // 7 days in minutes
        })

        // Extract hash from UHRP URL (format: uhrp://hash)
        const hash = result.uhrpURL.replace('uhrp://', '')
        setFileHash(hash)
        console.log('File uploaded successfully. Hash:', hash)
        console.log('UHRP URL:', result.uhrpURL)
        console.log('Payment processed through connected wallet')
      } catch (error) {
        console.error('Error uploading file:', error)
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        setFileHash(`Upload failed: ${errorMessage}`)
      } finally {
        setUploadingFile(false)
      }
    }
  }

  const handleCreateTokens = () => {
    // Generate 8 random bytes for padding
    const paddingBytes = new Uint8Array(8)
    crypto.getRandomValues(paddingBytes)
    const padding = '0x' + Array.from(paddingBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Generate second 8 random bytes for padding_2
    const paddingBytes_2 = new Uint8Array(8)
    crypto.getRandomValues(paddingBytes_2)
    const padding_2 = '0x' + Array.from(paddingBytes_2)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Create token data object
    const tokenData: TokenData = {
      id: padding,
      id2: padding_2,
      contractType,
      contractPointer,
      fiatDenomination: contractType === '0x00000001' ? fiatDenomination : undefined,
      numShares,
      issueDate: new Date().toISOString().split('T')[0],
      contractDuration: contractType !== '0x00000001' ? contractDuration : undefined,
      fileHash,
      peggingRate,
      shareValue, // no need
      transactionType
    }

    // Add token to the list
    setCreatedTokens([...createdTokens, tokenData])

    console.log('Token created:', tokenData)
    // Add token creation logic here
  }

  return (
    <div className="admin-dashboard-dark">
      <div className="admin-header-dark">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="logout-btn-admin" style={{ marginRight: '12px' }}>
              MY ASSETS {createdTokens.length > 0 && `(${createdTokens.length})`}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 max-h-[250px] overflow-y-auto !border !border-gray-300 !rounded-lg !shadow-lg !shadow-gray-400" style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(156, 163, 175, 0.5), 0 4px 6px -4px rgba(156, 163, 175, 0.5)' }}>
            {createdTokens.length === 0 ? (
              <DropdownMenuItem disabled>No tokens created yet</DropdownMenuItem>
            ) : (
              createdTokens.map((token) => {
                const typeDetails = getContractTypeDetails(token.contractType)
                return (
                  <div key={token.id} className="p-1">
                    <div className="card card-compact bg-black border border-gray-300 shadow-sm">
                      <div className="card-body p-2">
                        <h3 className="card-title text-xs text-white">
                          {typeDetails.label}
                        </h3>
                        <figure className="flex items-center justify-center py-1">
                          <img
                            src={typeDetails.icon}
                            alt={typeDetails.label}
                            className="object-contain"
                            width="125"
                            height="125"
                            style={{ width: '125px', height: '125px' }}
                          />
                        </figure>
                        <div className="text-gray-300 space-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span className="font-semibold">Shares:</span>
                            <span>{token.numShares}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Issue:</span>
                            <span>{token.issueDate}</span>
                          </div>
                          {token.contractDuration && (
                            <div className="flex justify-between">
                              <span className="font-semibold">Duration:</span>
                              <span>{token.contractDuration}</span>
                            </div>
                          )}
                          {token.fiatDenomination && (
                            <div className="flex justify-between">
                              <span className="font-semibold">Denom:</span>
                              <span>{token.fiatDenomination}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button className="logout-btn-admin" onClick={handleLogout}>
          LOGOUT
        </button>
      </div>

      <div className="admin-content-dark">
        <div className="calculator-section">
          <div className="calculator-left">
            <h2 className="section-title">Fee estimation calculator</h2>
            <p className="prices-label">Prices in USD</p>

            <div className="form-field">
              <label>CONTRACT TYPE</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="select-input"
              >
                <option value="0x00000001">Fiat Currency</option>
                <option value="0x00000002">Bonds</option>
                <option value="0x00000003">Tickets</option>
                <option value="0x00000004">Coupons</option>
              </select>
            </div>

            {contractType === '0x00000001' && (
              <div className="form-field">
                <label>FIAT DENOMINATION</label>
                <select
                  value={fiatDenomination}
                  onChange={(e) => setFiatDenomination(e.target.value)}
                  className="select-input"
                >
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            )}

            <div className="form-field">
              <label>CONTRACT POINTER</label>
              <input
                type="text"
                value={contractPointer}
                onChange={(e) => setContractPointer(e.target.value)}
                className="number-input"
                placeholder="IP address"
              />
            </div>

            <div className="form-field">
              <label>TRANSACTION TYPE</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="select-input"
              >
                <option value="0x01">Issuance</option>
                <option value="0x02">Payment</option>
                <option value="0x03">Redemption</option>
              </select>
            </div>

            <div className="form-field">
              <label>PEGGING RATE</label>
              <input
                type="number"
                value={peggingRate}
                onChange={(e) => setPeggingRate(e.target.value)}
                className="number-input"
                min="0"
                step="0.01"
                placeholder="BTC/fiat rate"
              />
            </div>

            <div className="form-field">
              <label>SHARE VALUE</label>
              <input
                type="number"
                value={shareValue}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || parseFloat(value) >= 0) {
                    setShareValue(value)

                    // If share value is less than 1, automatically set numShares = 1 / shareValue
                    const numericValue = parseFloat(value)
                    if (!isNaN(numericValue) && numericValue > 0 && numericValue < 1) {
                      const calculatedShares = Math.max(1, Math.round(1 / numericValue))
                      setNumShares(calculatedShares.toString())

                      // Update slider position to match the calculated shares
                      if (calculatedShares < 500000) setSliderValue(1)
                      else if (calculatedShares < 500000000) setSliderValue(2)
                      else if (calculatedShares < 500000000000) setSliderValue(3)
                      else if (calculatedShares < 500000000000000) setSliderValue(4)
                      else setSliderValue(5)
                    }
                  }
                }}
                className="number-input"
                min="0"
                step="0.01"
                placeholder="Share value"
              />
            </div>

            <div className="form-field">
              <label>NUM SHARES</label>
              <input
                type="number"
                value={numShares}
                onChange={(e) => handleNumSharesChange(e.target.value)}
                className="number-input"
                placeholder="Number of shares"
                min="0"
              />
            </div>

            {contractType !== '0x00000001' && (
              <div className="form-field">
                <label>CONTRACT DURATION</label>
                <input
                  type="date"
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                  className="number-input"
                  placeholder="Select end date"
                />
              </div>
            )}

            <div className="form-field">
              <label>CONTRACT HASH</label>
              <div className="hash-display">
                {fileHash || 'No file uploaded'}
              </div>
            </div>

            <div className="slider-field">
              <input
                type="range"
                min="0"
                max="5"
                value={sliderValue}
                onChange={(e) => handleSliderChange(parseInt(e.target.value))}
                className="slider"
              />
              <div className="slider-labels">
                <span>0</span>
                <span>1k</span>
                <span>1M</span>
                <span>1B</span>
                <span>1T</span>
                <span>1Q</span>
              </div>
            </div>

            

            <div className="file-upload-section">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileUpload}
                className="file-upload-input"
                accept=".csv,.xlsx,.json"
              />
              <label htmlFor="fileUpload" className="file-upload-label">
                {uploadingFile ? 'UPLOADING...' : selectedFile ? selectedFile.name : 'UPLOAD FILE'}
              </label>
            </div>

<div className="slider-value">
              <span className="slider-price">{pricePerThousand.toFixed(0)} sats per thousand per {getContractTypeLabel()}</span>

            </div>


            <div className="fees-breakdown">
              <h3 className="breakdown-title">ESTIMATED FEES</h3>

              <div className="fee-row-total">
                <span>Total sats needed for the Issuer</span>
                <span className="fee-value-total">
                  {(() => {
                    const shares = parseFloat(numShares) || 0
                    const rate = parseFloat(peggingRate) || 0
                    const totalSats = rate === 0 ? shares : shares * rate
                    return totalSats.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    })
                  })()}
                </span>
              </div>

              <div className="fee-row-spacer"></div>

              <div className="fee-row">
                <span>Base issuer operations fee</span>
                <span className="fee-value">${formatCurrency(baseIssuerFee)} / mo.</span>
              </div>

              <div className="fee-row-spacer"></div>

              <div className="fee-row">
                <span>Total one-time issuance action fees, in BSV</span>
                <span className="fee-value">{oneTimeFees} sats</span>
              </div>

              <div className="fee-row">
                <span>Total issuer operations fees</span>
                <span className="fee-value">${formatCurrency(issuerOpsFees)}</span>
              </div>

              <div className="fee-row-total">
                <span>Total issuer operations fees per {getContractTypeLabel()}</span>
                <span className="fee-value-total">${formatCurrency(totalPerCoupon)}</span>
              </div>
            </div>

            <button className="create-tokens-btn" onClick={handleCreateTokens}>
              CREATE TOKENS
            </button>
          </div>

          <div className="calculator-right">
            <div className="instructions-container">
              <h1 className="main-title">TOKENIZATION FEES CALCULATOR</h1>
              <h2 className="right-title">Estimate the costs of your use case</h2>

              <div className="instruction-section">
                <h3>1. Select the instrument type</h3>
              </div>

              <div className="instruction-section">
                <h3>2. Select Transaction type</h3>
              </div>

              <div className="instruction-section">
                <h3>3. Set an average size for issuance actions</h3>
                <p>
                  Contract action fees are fixed regardless of how many instruments are
                  transferred in each issuance action. To get a sense of the total cost for these
                  one-time action fees, estimate the average number of units issued to each
                  counterparty.
                </p>
              </div>

              <div className="instruction-section">
                <h3>4. Estimate total units outstanding</h3>
                <p>
                  flat monthly fee for issuer operations, and other fees may apply.
                </p>
                <p className="note-text">
                  For issuing instruments with fractional subdivisions, multiply
                  the total issued units outstanding by the number of decimal places supported.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

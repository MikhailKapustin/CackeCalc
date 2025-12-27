/**
 * Receipt Image Generator
 * Converts receipt data into a shareable image
 */

interface ReceiptData {
  recipeName: string
  weight: number
  pricePerUnit: number
  unit: string
  total: number
  currency: string
}

/**
 * Format number with spaces as thousands separator and 2 decimal places
 */
function formatNumber(num: number): string {
  const rounded = num.toFixed(2)
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Generate receipt as an image blob
 * @param receipt - Receipt data
 * @returns Promise<Blob> - Image blob ready for sharing
 */
export async function generateReceiptImage(receipt: ReceiptData): Promise<Blob> {
  const {
    recipeName,
    weight,
    pricePerUnit,
    unit,
    total,
    currency
  } = receipt

  const weightLabel = unit === 'кг' ? 'Вес' : 'Количество'
  const priceLabel = unit === 'кг' ? 'Цена за кг' : 'Цена за шт'

  // Create canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }

  // Canvas dimensions
  const width = 600
  const padding = 40
  const lineHeight = 30
  const headerHeight = 80
  const footerHeight = 80

  // Calculate content height dynamically
  const contentLines = 5 // Header emoji + blank + Торт + Weight + Price + blank + Total + blank + footer lines
  const contentHeight = headerHeight + (contentLines * lineHeight) + footerHeight
  canvas.width = width
  canvas.height = contentHeight + 100

  // Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Border
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 2
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

  let yPosition = padding + 20

  // Header with emoji
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#1976d2'
  ctx.textAlign = 'center'
  ctx.fillText('🍰 Ваш расчет заказа', canvas.width / 2, yPosition)
  yPosition += lineHeight * 2

  // Recipe name
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#333333'
  ctx.textAlign = 'left'
  ctx.fillText(`Торт: ${recipeName}`, padding, yPosition)
  yPosition += lineHeight * 1.5

  // Weight/Quantity
  ctx.font = '20px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#555555'
  ctx.fillText(`${weightLabel}: ${weight} ${unit}`, padding, yPosition)
  yPosition += lineHeight

  // Price per unit
  ctx.fillText(`${priceLabel}: ${formatNumber(pricePerUnit)} ${currency}`, padding, yPosition)
  yPosition += lineHeight * 1.8

  // Divider line
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, yPosition)
  ctx.lineTo(canvas.width - padding, yPosition)
  ctx.stroke()
  yPosition += lineHeight * 1.2

  // Total (highlighted)
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#2e7d32'
  ctx.fillText(`💰 ИТОГО: ${formatNumber(total)} ${currency}`, padding, yPosition)
  yPosition += lineHeight * 2

  // Footer
  ctx.font = '16px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = '#888888'
  ctx.textAlign = 'center'
  ctx.fillText('Посчитано в приложении CakeCost для кондитеров', canvas.width / 2, yPosition)
  yPosition += lineHeight * 0.8
  ctx.font = 'italic 14px system-ui, -apple-system, sans-serif'
  ctx.fillText('[Ссылка на приложение]', canvas.width / 2, yPosition)

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to generate image blob'))
      }
    }, 'image/png')
  })
}

/**
 * Generate receipt image as data URL for preview
 * @param receipt - Receipt data
 * @returns Promise<string> - Data URL of the image
 */
export async function generateReceiptImageDataURL(receipt: ReceiptData): Promise<string> {
  const blob = await generateReceiptImage(receipt)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read blob as data URL'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

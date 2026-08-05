/**
 * Receipt Image Generator
 * Converts receipt data into a shareable image with customization support
 */

import type { ReceiptSettings } from '@/types/receiptSettings'
import { Filesystem, Directory } from '@capacitor/filesystem'

interface ReceiptData {
  recipeName: string
  weight: number
  pricePerUnit: number
  unit: string
  total: number
  currency: string
}

interface ReceiptCustomization {
  settings?: ReceiptSettings
  showWatermark?: boolean
  watermarkText?: string
}

/**
 * Format number with spaces as thousands separator and 2 decimal places
 */
function formatNumber(num: number): string {
  const rounded = num.toFixed(2)
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Helper: Convert hex color and opacity to rgba
 */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const a = opacity / 100
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * Helper: Load image from filesystem or base64
 */
async function loadImage(path: string | null): Promise<HTMLImageElement | null> {
  if (!path) return null

  try {
    const fileData = await Filesystem.readFile({
      path,
      directory: Directory.Data
    })

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = fileData.data as string
    })
  } catch (error) {
    console.warn('Failed to load logo image:', error)
    return null
  }
}

/**
 * Generate receipt as an image blob with customization
 * @param receipt - Receipt data
 * @param customization - Optional customization settings
 * @returns Promise<Blob> - Image blob ready for sharing
 */
export async function generateReceiptImage(
  receipt: ReceiptData,
  customization?: ReceiptCustomization
): Promise<Blob> {
  const {
    recipeName,
    weight,
    pricePerUnit,
    unit,
    total,
    currency
  } = receipt

  const settings = customization?.settings
  const showWatermark = customization?.showWatermark ?? true
  const watermarkText = customization?.watermarkText ?? 'Посчитано в приложении Cake calc'

  // Get customization values or defaults
  const backgroundColor = settings?.backgroundColor ?? '#FFFFFF'
  const backgroundOpacity = settings?.backgroundOpacity ?? 100
  const textColor = settings?.textColor ?? '#000000'
  const logoPath = settings?.logoPath ?? null
  const logoOpacity = settings?.logoOpacity ?? 100
  const logoPosition = settings?.logoPosition ?? 'center'
  const businessName = settings?.businessName
  const contactPhone = settings?.contactPhone
  const instagram = settings?.instagram
  const website = settings?.website

  const weightLabel = unit === 'кг' ? 'Вес' : 'Количество'
  const priceLabel = unit === 'кг' ? 'Цена за кг' : 'Цена за шт'

  // Load logo image if exists
  const logoImage = await loadImage(logoPath)

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
  const footerHeight = businessName || contactPhone || instagram || website ? 120 : 80

  // Calculate content height dynamically
  const contentLines = 5 // Header emoji + blank + Торт + Weight + Price + blank + Total + blank + footer lines
  const contentHeight = headerHeight + (contentLines * lineHeight) + footerHeight
  canvas.width = width
  canvas.height = contentHeight + 100

  // Background with custom color and opacity
  ctx.fillStyle = hexToRgba(backgroundColor, backgroundOpacity)
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Border
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 2
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)

  // Draw logo if exists
  if (logoImage) {
    ctx.globalAlpha = logoOpacity / 100

    if (logoPosition === 'center') {
      // Center logo at top
      const logoMaxWidth = width - padding * 2
      const logoMaxHeight = 100
      const scale = Math.min(logoMaxWidth / logoImage.width, logoMaxHeight / logoImage.height, 1)
      const logoWidth = logoImage.width * scale
      const logoHeight = logoImage.height * scale
      const logoX = (width - logoWidth) / 2
      const logoY = 30

      ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight)
    } else if (logoPosition === 'watermark') {
      // Watermark position (bottom right corner)
      const logoMaxSize = 80
      const scale = Math.min(logoMaxSize / logoImage.width, logoMaxSize / logoImage.height, 1)
      const logoWidth = logoImage.width * scale
      const logoHeight = logoImage.height * scale
      const logoX = width - logoWidth - 20
      const logoY = canvas.height - logoHeight - 20

      ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight)
    }

    ctx.globalAlpha = 1.0
  }

  let yPosition = padding + 20

  // Header with emoji
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.fillText('🍰 Ваш расчет заказа', canvas.width / 2, yPosition)
  yPosition += lineHeight * 2

  // Recipe name
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.fillText(`Торт: ${recipeName}`, padding, yPosition)
  yPosition += lineHeight * 1.5

  // Weight/Quantity
  ctx.font = '20px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = textColor
  ctx.fillText(`${weightLabel}: ${weight} ${unit}`, padding, yPosition)
  yPosition += lineHeight

  // Price per unit
  ctx.fillText(`${priceLabel}: ${formatNumber(pricePerUnit)} ${currency}`, padding, yPosition)
  yPosition += lineHeight * 1.8

  // Divider line
  ctx.strokeStyle = textColor
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding, yPosition)
  ctx.lineTo(canvas.width - padding, yPosition)
  ctx.stroke()
  ctx.globalAlpha = 1.0
  yPosition += lineHeight * 1.2

  // Total (highlighted)
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif'
  ctx.fillStyle = textColor
  ctx.fillText(`💰 ИТОГО: ${formatNumber(total)} ${currency}`, padding, yPosition)
  yPosition += lineHeight * 2

  // Business contact information (Pro feature)
  if (businessName || contactPhone || instagram || website) {
    ctx.font = '16px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = textColor
    ctx.globalAlpha = 0.8
    ctx.textAlign = 'center'

    if (businessName) {
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
      ctx.fillText(businessName, canvas.width / 2, yPosition)
      yPosition += lineHeight * 0.9
      ctx.font = '16px system-ui, -apple-system, sans-serif'
    }

    if (contactPhone) {
      ctx.fillText(`📞 ${contactPhone}`, canvas.width / 2, yPosition)
      yPosition += lineHeight * 0.8
    }

    if (instagram) {
      ctx.fillText(`📷 ${instagram}`, canvas.width / 2, yPosition)
      yPosition += lineHeight * 0.8
    }

    if (website) {
      ctx.fillText(`🌐 ${website}`, canvas.width / 2, yPosition)
      yPosition += lineHeight * 0.8
    }

    ctx.globalAlpha = 1.0
  }

  // Watermark (Free version only)
  if (showWatermark) {
    yPosition = canvas.height - 40
    ctx.font = '14px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = textColor
    ctx.globalAlpha = 0.6
    ctx.textAlign = 'center'
    ctx.fillText(watermarkText, canvas.width / 2, yPosition)
    ctx.globalAlpha = 1.0
  }

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
 * @param customization - Optional customization settings
 * @returns Promise<string> - Data URL of the image
 */
export async function generateReceiptImageDataURL(
  receipt: ReceiptData,
  customization?: ReceiptCustomization
): Promise<string> {
  const blob = await generateReceiptImage(receipt, customization)
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

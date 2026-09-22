import { Alert, Share } from 'react-native';

export interface TaxInvoiceData {
  orderId: string;
  placedAt: string;
  buyerName: string;
  shippingAddress: string;
  sellerBusinessName: string;
  sellerGst: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  transporterName?: string | null;
  vehicleNumber?: string | null;
  lrNumber?: string | null;
}

export async function generateAndShareTaxInvoice(data: TaxInvoiceData) {
  const itemsText = data.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productName} (HSN: 6204) - Qty: ${item.quantity} x ₹${item.unitPrice} = ₹${item.totalPrice}`
    )
    .join('\n');

  const text = `
========================================
       FABZONE GST TAX INVOICE
========================================
Invoice No: #INV-${data.orderId.slice(0, 8).toUpperCase()}
Invoice Date: ${new Date(data.placedAt).toLocaleDateString('en-IN')}

[SELLER DETAILS]
Trade Name: ${data.sellerBusinessName}
GSTIN: ${data.sellerGst}
Country of Origin: India

[BUYER DETAILS]
Customer Name: ${data.buyerName}
Shipping Address: ${data.shippingAddress}
Payment Mode: ${data.paymentMethod.toUpperCase()}

${
  data.transporterName || data.vehicleNumber
    ? `[BULK TRANSPORT DETAILS]
Carrier: ${data.transporterName || 'Commercial Transporter'}
Vehicle No: ${data.vehicleNumber || 'N/A'}
LR/Bilty No: ${data.lrNumber || 'N/A'}
`
    : ''
}
[ITEMIZED PRODUCTS]
${itemsText}

----------------------------------------
Subtotal: ₹${data.subtotal.toLocaleString('en-IN')}
GST (5% Included): ₹${data.taxAmount.toLocaleString('en-IN')}
GRAND TOTAL: ₹${data.totalAmount.toLocaleString('en-IN')}
----------------------------------------
Issued under Rule 46 of CGST Rules, 2017.
========================================
  `.trim();

  try {
    await Share.share({
      title: `GST Tax Invoice #${data.orderId.slice(0, 8)}`,
      message: text,
    });
  } catch (err: any) {
    Alert.alert('Invoice Share Failed', err.message);
  }
}

export async function exportUserDataPDF(profileData: any, ordersCount: number) {
  const text = `
========================================
 FABZONE DPDPA 2023 PERSONAL DATA REPORT
========================================
Export Generated: ${new Date().toLocaleString('en-IN')}

[USER PROFILE RECORD]
User ID: ${profileData.id}
Full Name: ${profileData.full_name || 'N/A'}
Phone Number: ${profileData.phone || 'N/A'}
Account Role: ${(profileData.role || 'buyer').toUpperCase()}
Total Recorded Orders: ${ordersCount}

[ACTIVE CONSENTS & PERMISSIONS]
1. Identity & Profile Processing Consent (Granted)
2. Shipping Address & Delivery Processing Consent (Granted)
3. Transactional SMS & Order Notification Consent (Granted)
========================================
  `.trim();

  try {
    await Share.share({
      title: 'DPDPA Personal Data Export',
      message: text,
    });
  } catch (err: any) {
    Alert.alert('Export Failed', err.message);
  }
}

const path = require('path');
const puppeteer = require('puppeteer');


const generateInvoicePDF = async (order, user) => {
    const invoiceHTML = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table, th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h2>Invoice for Order #${order.id}</h2>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${user.username}</p>
      <p><strong>Transaction ID:</strong> ${order.paymentId}</p>
      <p><strong>Shipping Address:</strong> ${order.address}, ${order.pincode}</p>
      <h3>Items:</h3>
      <table>
        <tr><th></th><th>Product</th><th>Quantity</th><th>Price</th></tr>
        ${order.items
            .map(
                (item, index) => `<tr><td>${index + 1}</td><td>${item.title}</td><td>${item.quantity}</td><td>₹${item.price * item.quantity}</td></tr>`
            )
            .join("")}
      </table>

      <p><strong>Total Amount:</strong> ₹${order.amount}</p>
      <p><strong>Payable Amount:</strong> ₹${order.discountAmount}</p>
      <p><strong>Payment Status:</strong> ${order.status}</p>
    </body>
    </html>
  `;
    // Define PDF path
    const pdfPath = path.join(__dirname, `../invoices/invoice_${order.id}.pdf`);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(invoiceHTML);
    await page.pdf({ path: pdfPath, format: "A4" })

    await browser.close();
    return pdfPath;
}

module.exports=generateInvoicePDF
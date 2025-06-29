// Email styling utilities and CSS

export const emailStyles = `
  body { 
    font-family: Arial, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    margin: 0; 
    padding: 0; 
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    padding: 20px; 
  }
  .header { 
    background: linear-gradient(135deg, #10b981, #059669); 
    color: white; 
    padding: 30px; 
    text-align: center; 
    border-radius: 8px 8px 0 0; 
  }
  .header-success { 
    background: linear-gradient(135deg, #10b981, #059669); 
  }
  .header-warning { 
    background: linear-gradient(135deg, #f59e0b, #d97706); 
  }
  .header-error { 
    background: linear-gradient(135deg, #ef4444, #dc2626); 
  }
  .content { 
    background: #f9fafb; 
    padding: 30px; 
    border-radius: 0 0 8px 8px; 
  }
  .booking-card { 
    background: white; 
    border-radius: 8px; 
    padding: 20px; 
    margin: 20px 0; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
  }
  .listing-info { 
    display: flex; 
    align-items: center; 
    margin-bottom: 20px; 
  }
  .listing-image { 
    width: 80px; 
    height: 80px; 
    border-radius: 8px; 
    object-fit: cover; 
    margin-right: 15px; 
  }
  .details-grid { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 15px; 
    margin: 20px 0; 
  }
  .detail-item { 
    padding: 10px; 
    background: #f3f4f6; 
    border-radius: 6px; 
  }
  .detail-label { 
    font-weight: bold; 
    color: #374151; 
    font-size: 14px; 
  }
  .detail-value { 
    color: #111827; 
    margin-top: 4px; 
  }
  .price-total { 
    background: #10b981; 
    color: white; 
    padding: 15px; 
    border-radius: 8px; 
    text-align: center; 
    font-size: 18px; 
    font-weight: bold; 
  }
  .next-steps { 
    background: #eff6ff; 
    border-left: 4px solid #3b82f6; 
    padding: 20px; 
    margin: 20px 0; 
  }
  .button { 
    display: inline-block; 
    background: #10b981; 
    color: white; 
    padding: 12px 24px; 
    text-decoration: none; 
    border-radius: 6px; 
    font-weight: bold; 
    margin: 5px; 
  }
  .button-approve { 
    background: #10b981; 
  }
  .button-decline { 
    background: #ef4444; 
  }
  .button-view { 
    background: #3b82f6; 
  }
  .action-buttons { 
    text-align: center; 
    margin: 20px 0; 
  }
  .footer { 
    text-align: center; 
    margin-top: 30px; 
    color: #6b7280; 
    font-size: 14px; 
  }
  .amount { 
    color: #10b981; 
    font-weight: bold; 
    font-size: 18px; 
  }
  .warning-box { 
    background: #fef3c7; 
    border: 1px solid #f59e0b; 
    border-radius: 6px; 
    padding: 15px; 
    margin: 15px 0; 
  }
  .success-box { 
    background: #d1fae5; 
    border: 1px solid #10b981; 
    border-radius: 6px; 
    padding: 15px; 
    margin: 15px 0; 
  }
  .error-box { 
    background: #fee2e2; 
    border: 1px solid #ef4444; 
    border-radius: 6px; 
    padding: 15px; 
    margin: 15px 0; 
  }
`;

export function createEmailHTML(content: string, headerClass: string = 'header'): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GearGrab</title>
      <style>${emailStyles}</style>
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p>© 2024 GearGrab. Share the adventure! 🏔️</p>
          <p>Need help? Contact us at support@geargrab.co</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function createHeader(title: string, subtitle?: string, type: 'success' | 'warning' | 'error' | 'default' = 'default'): string {
  const headerClass = type === 'default' ? 'header' : `header header-${type}`;
  return `
    <div class="${headerClass}">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
  `;
}

export function createBookingCard(data: {
  listingTitle: string;
  listingImage: string;
  confirmationNumber: string;
  ownerName?: string;
  renterName?: string;
  startDate: string;
  endDate: string;
  deliveryMethod: string;
  pickupLocation?: string;
  totalPrice: number;
  showEarnings?: boolean;
}): string {
  return `
    <div class="booking-card">
      <div class="listing-info">
        <img src="${data.listingImage}" alt="${data.listingTitle}" class="listing-image">
        <div>
          <h3 style="margin: 0; color: #111827;">${data.listingTitle}</h3>
          ${data.ownerName ? `<p style="margin: 5px 0; color: #6b7280;">Hosted by ${data.ownerName}</p>` : ''}
          ${data.renterName ? `<p style="margin: 5px 0; color: #6b7280;">Requested by ${data.renterName}</p>` : ''}
          <p style="margin: 5px 0; color: #10b981; font-weight: bold;">Confirmation #${data.confirmationNumber}</p>
        </div>
      </div>
      
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Check-in</div>
          <div class="detail-value">${data.startDate}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Check-out</div>
          <div class="detail-value">${data.endDate}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Delivery</div>
          <div class="detail-value">${data.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Location</div>
          <div class="detail-value">${data.pickupLocation || 'TBD'}</div>
        </div>
      </div>
      
      <div class="price-total">
        ${data.showEarnings 
          ? `You'll earn: $${Math.round(data.totalPrice * 0.85)} (after fees)`
          : `Total: $${data.totalPrice}`
        }
      </div>
    </div>
  `;
}

export function createActionButtons(buttons: Array<{url: string, text: string, type?: 'approve' | 'decline' | 'view' | 'default'}>): string {
  const buttonElements = buttons.map(button => {
    const buttonClass = button.type ? `button button-${button.type}` : 'button';
    return `<a href="${button.url}" class="${buttonClass}">${button.text}</a>`;
  }).join('\n');

  return `
    <div class="action-buttons">
      ${buttonElements}
    </div>
  `;
}

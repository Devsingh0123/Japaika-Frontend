/**
 * Razorpay Standard Checkout SDK Integration
 * Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

/**
 * Opens the official Razorpay Standard Checkout modal
 *
 * @param {Object} options
 * @param {string} options.keyId - Razorpay Public Key ID (defaults to VITE_RAZORPAY_KEY_ID)
 * @param {string} options.orderId - Backend-generated Razorpay order ID
 * @param {number} [options.amountSubunits] - Amount in subunits (e.g. 79900 for ₹799)
 * @param {number} [options.amount] - Amount in standard currency units (e.g. 799)
 * @param {string} [options.currency="INR"] - ISO currency code
 * @param {string} [options.name="Japaika"] - Merchant business name
 * @param {string} [options.description] - Product or pack description
 * @param {string} [options.image="/japaikaLogo.svg"] - Brand logo URL
 * @param {Object} [options.user] - Prefill user info { name, email, phone }
 * @param {string} [options.themeColor="#9a4578"] - Hex color for checkout modal
 * @param {Function} options.onSuccess - Callback ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => void
 * @param {Function} [options.onFailure] - Callback (error) => void
 * @param {Function} [options.onDismiss] - Callback () => void
 */
export const openRazorpayCheckout = ({
  keyId,
  orderId,
  amountSubunits,
  amount,
  currency = "INR",
  name = "Japaika",
  description = "Japaika Consultation",
  image = "/japaikaLogo.svg",
  user = {},
  themeColor = "#9a4578",
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  if (typeof window === "undefined" || !window.Razorpay) {
    const error = new Error(
      "Razorpay checkout SDK is not loaded. Please refresh the page and try again."
    );
    onFailure?.(error);
    return;
  }

  const activeKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!activeKey) {
    const error = new Error("Razorpay Key ID is required to initialize payment.");
    onFailure?.(error);
    return;
  }

  // Razorpay expects amount in smallest currency subunit (paise/cents)
  const finalSubunits = amountSubunits || Math.round(Number(amount || 0) * 100);
  const safeCurrency = String(currency || "INR").trim().toUpperCase() === "USD" ? "USD" : "INR";

  const options = {
    key: activeKey,
    amount: finalSubunits,
    currency: safeCurrency,
    name,
    description,
    image,
    order_id: orderId,
    prefill: {
      name: user?.name || "",
      email: user?.email || "",
      contact: user?.phone || "",
    },
    theme: {
      color: themeColor,
    },
    modal: {
      ondismiss: () => {
        onDismiss?.();
      },
    },
    handler: (response) => {
      onSuccess?.(response);
    },
  };

  try {
    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (errorResponse) => {
      onFailure?.(errorResponse.error);
    });

    rzp.open();
  } catch (err) {
    onFailure?.(err);
  }
};

export default openRazorpayCheckout;

# Consumer concessions

The matching backend and OS concessions patches are required. No new npm packages are introduced.

Visit `/concessions/ORGANIZATION_ID`, a stand-specific link (`?stand=STAND_ID`), or the Order concessions link on an organization page once a stand exists. Guests can browse; sign-in returns to the same page and preserves the cart on this device. My orders shows existing payments and pickup status.

Stripe Embedded Checkout remains on the Corner League page. Its connected-account context and client secret come only from an authenticated API request. No client secret is stored locally. The cart and retry key persist without payment data; final menu prices, tax, limits, and stock are validated on the API. Closing payment leaves a resumable checkout until it expires. Customer cancellation is available before preparation starts; later changes go through stand staff.

Responsive layouts use touch-sized controls, a mobile cart shortcut, bounded scrollable dialogs, accessible focus/escape behavior, clear errors/empty states, and menu/order loading states. Dialogs sit above the app navigation. Receipt links open exact orders after sign-in. Customer order details refresh while open.

This batch supports US/USD pickup orders. The reviewed stand tax rate is supplied by the organization. Card payments are supported; specific browser wallet availability requires Stripe domain setup and a supported device. Receipt/ready emails use the existing API email worker. Read the API's `docs/concessions.md` for setup and deployment acceptance checks.

Validation: TypeScript/build and mocked browser flows at 320, 390, 768, and 1440 pixels. No live Stripe purchase/refund was performed here.

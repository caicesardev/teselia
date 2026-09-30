# OTP

Accessible one-time code input for verification codes sent by SMS, email or an authenticator app. It looks like a row of cells but is a single text field, so paste, SMS autofill, password managers and screen readers all work.

::: warning In development
`@teselia/otp` is not published yet. Version `1.0.0` is planned for **October 24, 2026**. The demo below is an early build: the cells follow typing, arrow keys and clicks, only digits are accepted, and pasting `123 456` or `123-456` fills all six cells. Validation and error messages come next. Scope and decisions: [design document](https://github.com/caicesardev/teselia/blob/main/design/otp.md).
:::

## Demo

<OtpDemo />

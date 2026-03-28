const mongoose = require('mongoose');
const path = require('path');
const Payment = require(path.join(__dirname, 'models', 'Payment'));

console.log('Payment Schema Enum:', Payment.schema.path('paymentType').options.enum);
process.exit(0);

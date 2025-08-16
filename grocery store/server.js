const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/products');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // serve your frontend files

app.use('/api/products', productRoutes);

app.listen(PORT, () => {
  console.log(Server running on http://localhost:${PORT});
});
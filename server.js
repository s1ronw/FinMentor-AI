const express = require('express');
const { PythonShell } = require('python-shell');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors()); // Enable CORS to allow frontend requests
app.use(express.json());
app.use(express.static('public')); // Serve frontend files

app.post('/analyze-pdf', (req, res) => {
  const { pdfText } = req.body;

  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: './',
    args: [pdfText]
  };

  PythonShell.run('analyze.py', options, (err, results) => {
    if (err) {
      console.error('Python error:', err);
      return res.status(500).json({ error: 'Failed to analyze PDF' });
    }
    try {
      const analysis = JSON.parse(results[0]);
      res.json(analysis);
    } catch (parseErr) {
      console.error('Parse error:', parseErr);
      res.status(500).json({ error: 'Invalid analysis response' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
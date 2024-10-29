
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mongoose = require("mongoose");
const { TfIdf } = require("natural");
const nlp = require("compromise");
const WordPOS = require("wordpos");
const wordpos = new WordPOS();
const cors = require('cors');
const fs=require('fs')

const app = express();
app.use(express.json());

app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, 
}));
const PORT = process.env.PORT || 3000;

// MongoDB setup
mongoose.connect("mongodb+srv://mramankasaudhan07:xYDjIBHwYvzy6Bcu@cluster0.13ipt.mongodb.net/resumeAnalyzer", {
  family: 4,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err))

// Define MongoDB Schema and Model for storing analysis data (optional)
const AnalysisSchema = new mongoose.Schema({
  resumeText: String,
  jobDescription: String,
  matchScore: Number,
  missingSkills: [String],
});
const Analysis = mongoose.model("Analysis", AnalysisSchema);

// File upload setup
const upload = multer({ dest: "uploads/" });

// Helper function: Extract keywords from text with improved filtering
async function extractKeywords(text) {
  const tfidf = new TfIdf();

  // Use compromise to extract nouns, verbs, and adjectives
  const doc = nlp(text);
  const relevantWords = doc
    .nouns()
    .concat(doc.verbs())
    .concat(doc.adjectives())
    .out('array');

  // Lemmatize words using wordpos
  const lemmatizedWords = await Promise.all(
    relevantWords.map(async (word) => {
      const lemma = await wordpos.lookup(word);
      return lemma.length ? lemma[0].lemma : word;
    })
  );

  tfidf.addDocument(lemmatizedWords.join(" "));

  const terms = [];
  tfidf.listTerms(0).forEach((item) => {
    if (item.tfidf > 0.1) terms.push(item.term); // Adjust threshold if needed
  });

  return terms;
}

// Route: Analyze resume based on job description
app.post("/analyze", upload.single("resume"), async (req, res) => {
  const jobDescription = req.body.jobDescription;
  // console.log(jobDescription);
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const resumeText = await pdfParse(req.file.path);
    const resumeContent = resumeText.text;

    // Extract keywords with improved function
    const resumeKeywords = await extractKeywords(resumeContent);
    const jobKeywords = await extractKeywords(jobDescription);

    const matchingKeywords = resumeKeywords.filter((keyword) =>
      jobKeywords.includes(keyword)
    );
    const matchScore = (matchingKeywords.length / jobKeywords.length) * 100;

    const missingSkills = jobKeywords.filter(
      (keyword) => !matchingKeywords.includes(keyword)
    );

    // Save analysis to MongoDB
    const analysis = new Analysis({
      resumeText: resumeContent,
      jobDescription,
      matchScore,
      missingSkills,
    });
    await analysis.save();

    res.json({
      matchScore: matchScore.toFixed(2),
      matchingKeywords,
      missingSkills,
      suggestion:
        missingSkills.length > 0
          ? "Consider adding these skills for a better match."
          : "Your resume matches well with the job description.",
    });

     // Delete the uploaded file after processing
     fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting file:", err);
    });
  } catch (error) {
    console.error("Error processing resume:", error);
    res.status(500).json({ message: "Error processing resume", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



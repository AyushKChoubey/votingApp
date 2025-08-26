
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/jwt');
const candidateController = require('../controllers/candidateController');
const Candidate = require('../models/candidate');

// SSR: Candidates list page
router.get('/', async (req, res) => {
	const candidates = await Candidate.find();
	res.render('candidates', { candidates });
});

// SSR: Results page
router.get('/vote/count', async (req, res) => {
	const candidates = await Candidate.find().sort({ voteCount: 'desc' });
	res.render('results', { candidates });
});

// API routes
router.post('/', jwtAuthMiddleware, candidateController.addCandidate);
router.put('/:candidateID', jwtAuthMiddleware, candidateController.updateCandidate);
router.delete('/:candidateID', jwtAuthMiddleware, candidateController.deleteCandidate);
router.post('/vote/:candidateID', jwtAuthMiddleware, candidateController.voteCandidate);
router.get('/api/vote/count', candidateController.voteCount);
router.get('/api', candidateController.listCandidates);

module.exports = router;
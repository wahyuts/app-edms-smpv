const express = require('express');
const projectContextController = require('../controllers/projectContext.controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/', projectContextController.getProjectContext);
router.post('/active-project', projectContextController.selectActiveProject);

module.exports = router;

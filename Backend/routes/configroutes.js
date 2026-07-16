const express = require('express');
const router = express.Router();
const Config = require('../models/ConfigModel');

// Get config for a company
router.get('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    let config = await Config.findOne({ companyId });

    // If no config exists, return default (model has defaults)
    if (!config) {
      config = new Config({ companyId });
      // We don't necessarily need to save it yet, just return the defaults
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update config for a company
router.post('/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { projectStatuses, taskStatuses, taskPriorities, customClientCategories, customClientSources, appTheme, customColor } = req.body;

    let config = await Config.findOne({ companyId });

    if (config) {
      if (projectStatuses) config.projectStatuses = projectStatuses;
      if (taskStatuses) config.taskStatuses = taskStatuses;
      if (taskPriorities) config.taskPriorities = taskPriorities;
      if (customClientCategories) config.customClientCategories = customClientCategories;
      if (customClientSources) config.customClientSources = customClientSources;
      if (appTheme) config.appTheme = appTheme;
      if (customColor) config.customColor = customColor;
      await config.save();
    } else {
      config = new Config({
        companyId,
        projectStatuses,
        taskStatuses,
        taskPriorities,
        customClientCategories,
        customClientSources,
        appTheme,
        customColor
      });
      await config.save();
    } res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

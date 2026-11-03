const createController = (service) => {
  const handle = (method) => async (req, res) => {
    try {
      if (method === 'remove' && req.body !== undefined && (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body))) {
        return res.status(422).json({ success: false, message: 'Data penghapusan tidak valid.' });
      }
      const data = await service[method]({ actorUserId: req.user?.id, activeProject: req.activeProject,
        projectId: req.query.projectId, documentId: req.params.documentId, operationId: req.query.operationId,
        requestKey: req.get('Idempotency-Key'), reason: req.body?.reason });
      const statusCode = data.status === 'COMPLETED' ? 200 : data.status === 'CONFLICT' ? 409 : data.status === 'FAILED' ? 500 : 202;
      return res.status(statusCode).json({ success: data.status === 'COMPLETED', message: data.message, data });
    } catch (error) {
      if (error.publicDeleteError) return res.status(error.statusCode).json({ success: false, message: error.message, data: error.data });
      // Never forward SQL/provider details through the global error response.
      return res.status(503).json({ success: false, message: 'Status penghapusan belum dapat dipastikan. Silakan periksa status operasi.', data: { status: 'UNKNOWN' } });
    }
  };
  return { remove: handle('remove'), status: handle('status') };
};

module.exports = { createController };

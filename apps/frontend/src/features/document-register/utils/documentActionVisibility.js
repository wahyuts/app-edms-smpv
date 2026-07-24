import {
  ACTION_CODE,
  DOCUMENT_ACTION_PERMISSION,
  DOCUMENT_ACTION_VISIBILITY_MATRIX,
  DOCUMENT_WORKFLOW_ACTIONS_BY_STATUS,
} from "../constants/document.constants";

const topRowActions = [
  ACTION_CODE.VIEW,
  ACTION_CODE.DOWNLOAD,
  ACTION_CODE.COMMENT,
];

const workflowActions = [
  ACTION_CODE.APPROVAL_A,
  ACTION_CODE.APPROVAL_B,
  ACTION_CODE.APPROVAL_C,
];

const filterPermittedActions = (actions, hasPermission) => {
  return actions.filter((actionCode) =>
    hasPermission(DOCUMENT_ACTION_PERMISSION[actionCode]),
  );
};

export const getDocumentActionVisibility = ({
  hasPermission,
  roleName,
  status,
}) => {
  const matrixActions = DOCUMENT_ACTION_VISIBILITY_MATRIX[roleName]?.[status] ?? [];
  const permittedActions = filterPermittedActions(matrixActions, hasPermission);
  const allowedWorkflowActions =
    DOCUMENT_WORKFLOW_ACTIONS_BY_STATUS[status] ?? [];

  return {
    topActions: topRowActions.filter((actionCode) =>
      permittedActions.includes(actionCode),
    ),
    workflowActions: workflowActions.filter(
      (actionCode) =>
        permittedActions.includes(actionCode) &&
        allowedWorkflowActions.includes(actionCode),
    ),
    showHistory: permittedActions.includes(ACTION_CODE.HISTORY),
  };
};

async function onFormLoad(executionContext) {
  const formContext = executionContext.getFormContext();
  const ClosedPostedValue = 100000001;
  const workOrderRef = formContext.getAttribute("new_fk_work_order").getValue();
  if (workOrderRef === null) return;
  const workOrderId = workOrderRef[0].id;
  const workOrder = await Xrm.WebApi.retrieveRecord("new_work_order", workOrderId, "?$select=new_os_status");
  if(workOrder === null) return
  if(workOrder["new_os_status"] === ClosedPostedValue) {
    const controls = formContext.ui.controls.get();
    controls.forEach((control) => {
      control.setDisabled(true);
    });
  }
}
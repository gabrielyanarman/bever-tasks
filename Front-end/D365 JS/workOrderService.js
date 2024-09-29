function calculateTotalAmount(executionContext) {
    const formContext = executionContext.getFormContext();
    const pricePerHour = formContext.getAttribute("new_mon_price_per_unit").getValue();
    const duration = formContext.getAttribute("new_int_duration").getValue();

    if(!pricePerHour || !duration) formContext.getAttribute("new_mon_total_amount").setValue(null);

    const totalAmount = pricePerHour*duration/60

    formContext.getAttribute("new_mon_total_amount").setValue(totalAmount);
}

async function setPricePerUnitHr(executionContext) {
  const formContext = executionContext.getFormContext();

  const serviceRef = formContext.getAttribute("new_fk_service").getValue();
  if (serviceRef === null) return;
  const serviceId = serviceRef[0].id;

  const servicePricePerUnitHr = await getPricePerUnitHr(serviceId);

  formContext
    .getAttribute("new_mon_price_per_unit")
    .setValue(servicePricePerUnitHr);
}

async function getPricePerUnitHr(id) {
  const service = await Xrm.WebApi.retrieveRecord("new_product", id, "?$select=new_mon_price_per_unit");
  return service["new_mon_price_per_unit"];
}

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
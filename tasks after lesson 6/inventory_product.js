function configureFieldName(executionContext) {
  const formContext = executionContext.getFormContext();
  const attribute = formContext.getAttribute("new_name");
  const control = formContext.getControl("new_name");
  if (attribute && control) {
    attribute.setRequiredLevel("none");
    control.setDisabled(true);
  }
}

function setName(executionContext) {
  const formContext = executionContext.getFormContext();
  const productLookup = formContext.getAttribute("new_fk_product").getValue();
  if (productLookup !== null) {
    formContext.getAttribute("new_name").setValue(productLookup[0].name);
    return;
  }
  formContext.getAttribute("new_name").setValue("");
}

function calculateTotalAmount(executionContext) {
  const formContext = executionContext.getFormContext();
  const quantity = formContext.getAttribute("new_int_quantity").getValue();
  const price = formContext.getAttribute("new_mon_price_per_unit").getValue();
  if (quantity !== null && price !== null) {
    const totalAmount = price * quantity;
    formContext.getAttribute("new_mon_total_amount").setValue(totalAmount);
  } else {
    formContext.getAttribute("new_mon_total_amount").setValue(0);
  }
}

function toggleFields(executionContext) {
  const formContext = executionContext.getFormContext();
  const isNewRecord = formContext.ui.getFormType() === 1;
  const controls = formContext.ui.controls.get();
  controls.forEach((control) => {
    const attribute = formContext.getAttribute(control.getName());
    if (attribute && attribute.getName() !== "new_name") {
      control.setDisabled(isNewRecord ? false : true);
    }
  });
}

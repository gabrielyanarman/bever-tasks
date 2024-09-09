function checkType(executionContext) {
  const formContext = executionContext.getFormContext();
  const productTypeValue = formContext.getAttribute("new_os_type").getValue();
  if (productTypeValue !== 100000001) {
    formContext.getControl("new_mon_price_per_unit").setVisible(true);
    formContext.getControl("new_mon_cost").setVisible(true);
  } else {
    formContext.getControl("new_mon_price_per_unit").setVisible(false);
    formContext.getControl("new_mon_cost").setVisible(false);
  }
}

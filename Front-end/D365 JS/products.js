function checkType(executionContext) {
  const formContext = executionContext.getFormContext();
  const productTypeValue = formContext.getAttribute("new_os_type").getValue();
  productTypeValue === 100000000
    ? formContext.getControl("new_mon_price_per_unit").setVisible(true)
    : formContext.getControl("new_mon_price_per_unit").setVisible(false);
}

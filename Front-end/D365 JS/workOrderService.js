function calculateTotalAmount(executionContext) {
    const formContext = executionContext.getFormContext();
    const pricePerHour = formContext.getAttribute("new_mon_price_per_unit").getValue();
    const duration = formContext.getAttribute("new_int_duration").getValue();

    if(!pricePerHour || !duration) formContext.getAttribute("new_mon_total_amount").setValue(null);

    const totalAmount = pricePerHour*duration/60

    formContext.getAttribute("new_mon_total_amount").setValue(totalAmount);
}
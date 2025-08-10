
export const webhook = (req, res) => {
  const event = req.body;

  // ตรวจสอบชนิดของ Event ที่ได้รับ
  switch (event.key) {
    case 'charge.complete':
      const charge = event.data;
      if (charge.status === 'successful') {
        // เมื่อการชำระเงินสำเร็จจากช่องทางอื่นๆ (เช่น PromptPay, Internet Banking)
        // คุณสามารถอัปเดตสถานะการสั่งซื้อในฐานข้อมูลได้ที่นี่
        console.log(`Webhook: Charge ${charge.id} is successful.`);
        console.log(`Order ID: ${charge.description}`);
      }
      break;

    case 'refund.complete':
      // จัดการเมื่อมีการคืนเงินสำเร็จ
      const refund = event.data;
      console.log(`Webhook: Refund ${refund.id} is complete.`);
      break;

    // เพิ่ม case อื่นๆ ที่คุณต้องการจัดการ
    // เช่น charge.fail, charge.expire, etc.
  }

  // ส่ง HTTP 200 OK กลับไปให้ Omise เพื่อยืนยันว่าได้รับข้อมูลแล้ว
  res.sendStatus(200);
}
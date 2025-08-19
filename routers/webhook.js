import Membership from "../models/Membership.js"
import { User } from "../models/User.js"
export const webhook = async (req, res) => {
  const event = req.body;

  // ตรวจสอบชนิดของ Event ที่ได้รับ
  switch (event.key) {
    case 'charge.complete':
      const charge = event.data;
      await Payment.findOneAndUpdate(
        { chargeId: charge.id },
        {
          status: charge.paid ? "paid" : "failed",
          failureReason: charge.failure_code || null,
          updatedAt: new Date()
        }
      )
      if (charge.status === 'successful') {
        // เมื่อการชำระเงินสำเร็จจากช่องทางอื่นๆ (เช่น PromptPay, Internet Banking)
        // คุณสามารถอัปเดตสถานะการสั่งซื้อในฐานข้อมูลได้ที่นี่
        const amount = charge.amount / 100 // Omise ใช้หน่วยเป็นสตางค์
        const userId = charge.metadata.userId
        
        console.log(`Webhook: Charge ${charge.id} is successful.`);
        console.log(`Order ID: ${charge.description}`);
        console.log("data", charge)
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
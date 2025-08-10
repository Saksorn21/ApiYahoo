import omise from "omise"
import logger from "../utils/logger.js"
const omiseInstance = omise({
  secretKey: process.env.OMISE_SECRET_KEY,
  publicKey: process.env.OMISE_PUBLIC_KEY
})

export const payment = async (req, res) =>{
  try {
     const { amount, token, orderId } = req.body
    if (!token || !amount || !orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // สร้างรายการ Charge ด้วย Secret Key
    const charge = await omiseInstance.charges.create({
      amount: amount * 100, // Omise ใช้หน่วยเป็นสตางค์
      currency: 'thb',
      card: token, // Token ที่ได้รับจาก Frontend
      description: `Order ID: ${orderId}`,
    });

    if (charge.status === 'successful') {
      // เมื่อการชำระเงินสำเร็จ
      // อัปเดตสถานะการสั่งซื้อในฐานข้อมูลของคุณ
      // ส่งคำตอบกลับไปหาลูกค้า
      logger.debug('Payment successful:', charge);
      res.status(200).json({ 
        message: 'Payment successful',
        chargeId: charge.id,
        status: charge.status,
      });
    } else {
      // การชำระเงินไม่สำเร็จ
      logger.debug('Payment failed:', charge.failure_message);
      res.status(400).json({
        error: 'Payment failed',
        message: charge.failure_message,
      });
    }

    } catch (err) {
    console.error('Error during payment process:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }  
}
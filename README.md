# usctobath

📱 **USC to THB Currency Converter (iPhone 16 Pro Max Edition)**

เว็บแอปพลิเคชันคำนวณแปลงค่าเงิน **USC ⇄ THB (บาทไทย)** ออกแบบพิเศษตามสไตล์ **Apple iOS 18** พร้อมสัดส่วนหน้าจอ Dynamic Island, Bezel บางเฉียบแบบ **iPhone 16 Pro Max** และรองรับการทำงานแบบ Fullscreen PWA บนมือถือ

---

### 🧮 สูตรการคำนวณ (Calculation Formula)
- **อัตราแลกเปลี่ยน (Rate):** นำเงินบาทตั้ง หารด้วยจำนวน USC
  $$\text{เรทต่อ 1 USC} = \frac{\text{เงินบาท}}{\text{USC}} = \frac{4,995.26}{14,773} = 0.33813443... \text{ บาท}$$
- **แปลง USC เป็น บาท (THB):**
  $$\text{THB} = \text{USC} \times \text{Rate}$$
  ตัวอย่าง: $14,773 \times 0.33813443 = 4,995.26 \text{ บาท}$
- **แปลง บาท (THB) เป็น USC:**
  $$\text{USC} = \frac{\text{THB}}{\text{Rate}}$$
  ตัวอย่าง: $4,995.26 \div 0.33813443 = 14,773 \text{ USC}$

---

### 💾 ระบบจัดเก็บข้อมูลภายในเครื่อง (Local Device Storage)
ข้อมูลทั้งหมดถูกบันทึกไว้ในหน่วยความจำของอุปกรณ์ (Browser LocalStorage) โดยตรง ไม่ส่งข้อมูลออกไปยังเซิร์ฟเวอร์ภายนอก:
- บันทึกอัตราแลกเปลี่ยนล่าสุด (Exchange Rate)
- บันทึกโหมดที่ใช้งานล่าสุด (USC ➔ THB หรือ THB ➔ USC)
- บันทึกประวัติการคำนวณ 20 รายการล่าสุด พร้อมวันเวลา
- บันทึกการตั้งค่าเสียงเอฟเฟกต์คลิก

---

### 🚀 วิธีเปิดใช้งาน
```bash
# รัน Local Web Server
python3 -m http.server 8080
```
เปิดเบราว์เซอร์แล้วเข้าใช้งานที่ `http://localhost:8080/`

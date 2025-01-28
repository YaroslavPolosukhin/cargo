import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

function createMulterStorage (folderName) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join('uploads', folderName)

      console.log(uploadPath)
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true })
      }

      cb(null, uploadPath)
    },

    filename: function (req, file, cb) {
      const uniqueHash = crypto.createHash('sha256').update(Date.now().toString()).digest('hex')
      cb(null, uniqueHash + path.extname(file.originalname))
    }
  })
}

export const passportUpload = multer({ storage: createMulterStorage('passports') })
export const driverLicenseUpload = multer({ storage: createMulterStorage('driver_license') })

import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Controller('messages')
export class MessagesController {
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads', 
            filename: (req, file, callback) => {
                const fileExtName = path.extname(file.originalname);
                const fileName = `${uuidv4()}${fileExtName}`;
                callback(null, fileName);
            },
        }),
    }))
    uploadFile(@UploadedFile() file: Express.Multer.File) { 
        return {url: `http://localhost:3000/uploads/${file.filename}`}
    }
}
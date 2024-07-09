import { Router, Request, Response } from "express";
import Auth from '../middleware/auth';


const router = Router();

router.get("/", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 5;

        

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

export default router;
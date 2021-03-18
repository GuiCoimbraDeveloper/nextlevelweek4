import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { SurveysRepository } from '../repositories/SurveysRepository';
import { SurveysUsersRepository } from '../repositories/SurveysUsersRepository';
import { UserRepository } from '../repositories/UserRepository';
import SendMailService from '../services/SendMailService';
import { resolve } from 'path';
import { AppError } from '../errors/AppError';

class SendMailController {

    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body;

        const usersRepository = getCustomRepository(UserRepository);
        const surveyRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

        const user = await usersRepository.findOne({ email });
        if (!user)
            throw new AppError("user does not exists.");

        const survey = await surveyRepository.findOne({ id: survey_id });
        if (!survey)
            throw new AppError("survey does not exists.");


        const npsPath = resolve(__dirname, "..", "views", "emails", "npsmail.hbs");

        const surveyUserAlreadyExist = await surveysUsersRepository.findOne({
            // or condição where: [{ user_id: user.id }, { value: null }],
            where: { user_id: user.id, value: null },
            relations: ['user', 'survey']
        });

        const vaiables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: '',
            link: process.env.URL_MAIL,
        };

        if (surveyUserAlreadyExist) {
            vaiables.id = surveyUserAlreadyExist.id
            await SendMailService.execute(email, survey.title, vaiables, npsPath);
            return response.json(surveyUserAlreadyExist);
        }

        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id: survey_id
        });

        await surveysUsersRepository.save(surveyUser);
        vaiables.id = surveyUser.id;

        await SendMailService.execute(email, survey.title, vaiables, npsPath);

        return response.status(201).json(surveyUser);
    }
}

export { SendMailController };


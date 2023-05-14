const puppeteer = require("puppeteer");
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});


const scrapper =  async () => {
    const urls = [
        "https://www.linkedin.com/jobs/search?keywords=Backend%20Developer&location=India&locationId=&geoId=102713980&f_TPR=r604800&position=1&pageNum=0",
        "https://www.linkedin.com/jobs/search?keywords=Frontend%20Developer&location=India&locationId=&geoId=102713980&f_TPR=r604800&position=1&pageNum=0",
        "https://www.linkedin.com/jobs/search?keywords=Full+Stack+Engineer&location=India&locationId=&geoId=102713980&f_TPR=r604800"
    ]
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    try {
        for (const url of urls) {
            const str = url.split("/")[4];
            const queryParams = str.split("?")[1];
            let jobType = queryParams.split("&")[0].substring(9);

            jobType = jobType.replace(/%20/g, " ");
            jobType = jobType.replace(/\+/g, " ");

            await page.goto(url);
            // await page.goto("https://www.linkedin.com/jobs/search?trk=guest_homepage-basic_guest_nav_menu_jobs&position=1&pageNum=0");

            await page.waitForSelector('.base-search-bar__form', { timeout: 60000 });

            // await page.screenshot({ path: "photo1.png", fullPage: true });

            try {
                const jobs = await page.evaluate(async () => {
                    const jobList = document.querySelectorAll(".jobs-search__results-list .job-search-card");

                    return Array.from(jobList, (e) => ({
                        company: e.querySelector(".base-search-card__info .base-search-card__subtitle").innerText,
                        jobTitle: e.querySelector(".base-search-card__info .base-search-card__title").innerText,
                        applyLink: e.querySelector("a").href
                    }))
                })

                const mailOptions = {
                    from: "lakshmiroy52@gmail.com",
                    to: 'abhinabroy2001@gmail.com',
                    subject: `${jobType} jobs from Linkedin by Abhinab 🔥`,
                    html: '<h1>Job openings</h1>' +
                    '<table>' +
                    '<tr><th>Company</th><th>Job Title</th><th>Apply Link</th></tr>' +
                    jobs.map(job => `<tr><td>${job.company}</td><td>${job.jobTitle}</td><td>${job.applyLink}</td></tr>`).join('') +
                    '</table>'
                };

                // Send the email
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });
            } catch (error) {
                console.log("Error 1 -> ", error.message)
            }
        }

        await browser.close();
    } catch (error) {
        console.log(error.message);
    }


};

const task = cron.schedule('0 9 * * *', () => {
    scrapper();
});

task.start();
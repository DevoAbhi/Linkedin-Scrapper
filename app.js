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
    //PAST 24 HOURS
    const urls = [
        "https://www.linkedin.com/jobs/search?keywords=Back%20End%20Developer&location=India&locationId=&geoId=102713980&f_TPR=r86400&position=1&pageNum=0",
        "https://www.linkedin.com/jobs/search?keywords=FrontEnd%20Developer&location=India&locationId=&geoId=102713980&f_TPR=r86400&position=1&pageNum=0",
        "https://www.linkedin.com/jobs/search?keywords=Full%20Stack%20Engineer&location=India&locationId=&geoId=102713980&f_TPR=r86400&position=1&pageNum=0"
    ]

    // PAST 1 WEEK
    // const urls = [
    //     "https://www.linkedin.com/jobs/search?keywords=Backend%20Developer&location=India&locationId=&geoId=102713980&f_TPR=r604800&position=1&pageNum=0",
    //     "https://www.linkedin.com/jobs/search?keywords=Frontend%20Developer&location=India&locationId=&geoId=102713980&f_TPR=r604800&position=1&pageNum=0",
    //     "https://www.linkedin.com/jobs/search?keywords=Full+Stack+Engineer&location=India&locationId=&geoId=102713980&f_TPR=r604800"
    // ]

    const browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            '--disable-site-isolation-trials',
            "--no-sandbox",
            "--no-zygote"
        ],
        headless: "new",
        executablePath: process.env.NODE_ENV === "production" ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
    });
    const page = await browser.newPage();
    try {
        for (const url of urls) {
            const str = url.split("/")[4];
            const queryParams = str.split("?")[1];
            let jobType = queryParams.split("&")[0].substring(9);

            jobType = jobType.replace(/%20/g, " ");
            jobType = jobType.replace(/\+/g, " ");

            await page.goto(url);

            await page.waitForSelector('.jobs-search__results-list', { timeout: 60000 });


            try {
                const jobs = await page.evaluate(async () => {
                    await new Promise((resolve) => {
                        const interval = setInterval(() => {
                          const element = document.querySelector('.jobs-search__results-list .job-search-card');
                          if (element) {
                            clearInterval(interval);
                            resolve();
                          }
                        }, 100);
                      });
                    const jobList = document.querySelectorAll(".jobs-search__results-list .job-search-card");

                    return Array.from(jobList, (e) => ({
                        company: e.querySelector(".base-search-card__info .base-search-card__subtitle").innerText,
                        jobTitle: e.querySelector(".base-search-card__info .base-search-card__title").innerText,
                        applyLink: e.querySelector(".base-card__full-link").href
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

    } catch (error) {
        console.log(error.message);
    }

    finally{
        await browser.close();
    }


};

const task = cron.schedule('5 * * * *', () => {
    scrapper();
});
// const task = cron.schedule('0 9 * * *', () => {
//     scrapper();
// });

task.start();
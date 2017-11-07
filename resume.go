package main

import (
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"net/http"
	"time"
)

type basicInfo struct {
	Name        string `json:"name"`
	PhoneNumber string `json:"phone"`
	Email       string `json:"email"`
	Github      string `json:"github"`
}

type education struct {
	StartDate *int64 `json:"start_date"`
	EndDate   *int64 `json:"end_date"`
	School    string `json:"university"`
	Degree    string `json:"degree"`
	Major     string `json:"major"`
}

type position struct {
	StartDate   *int64 `json:"start_date"`
	EndDate     *int64 `json:"end_date"`
	Company     string `json:"company"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type resume struct {
	BasicInfo   basicInfo  `json:"contact_info"`
	Education   education  `json:"education"`
	WorkHistory []position `json:"work_history"`
}

func resumeHandler(res http.ResponseWriter, req *http.Request) {
	CST, _ := time.LoadLocation("America/Chicago")
	schoolStartDate := time.Date(2009, time.August, 21, 9, 0, 0, 0, CST).Unix()
	schoolEndDate := time.Date(2011, time.May, 12, 5, 0, 0, 0, CST).Unix()

	edgecaseStartDate := time.Date(2015, time.April, 1, 9, 0, 0, 0, CST).Unix()
	edgecaseEndDate := time.Date(2016, time.May, 1, 5, 0, 0, 0, CST).Unix()

	ordoroStartDate := time.Date(2016, time.May, 3, 9, 0, 0, 0, CST).Unix()
	// ordoroEndDate := time.Date(2017, time.September, 27, 5, 0, 0, 0, CST).Unix()

	resume := &resume{
		BasicInfo: basicInfo{
			Name:        "Jeffrey Dorrycott",
			PhoneNumber: "KDUxMikgNTI5LTQ4NjI=",
			Email:       "dmVyeWdvb2Rzb2Z0d2FyZW5vdHZpcnVzQHByb3Rvbm1haWwuY29t",
			Github:      "https://github.com/verygoodsoftwarenotvirus",
		},
		WorkHistory: []position{
			{
				Company: "Edgecase.io",
				Title:   "Junior Software Engineer",
				Description: `Responsible for developing and maintaining ETL code for client product feeds in Ruby. When a client provides us a non-standard feed, we have to retrieve, standardize, and load it into our products database.

				Contributed new features and visual fixes to our internal platform tool, which is a full-stack javascript app. When adding new features or fixing old ones, was responsible for both back end and front end development, whatever is necessary.

				Developed a curation framework in Python for retrieving very specific information from a wide variety of documents, which led to one of our clients being 70% machine curated, and the first in company history to be curated at around a dollar per product.

				Developed a web app in Angular to assure quality in human curation, which saved an average of 8 hours per week of work.

				Developed a prototype to detect colors in products in Go.

				Was promoted to the engineering team`,
				StartDate: &edgecaseStartDate,
				EndDate:   &edgecaseEndDate,
			},
			{
				Company:     "Ordoro",
				Title:       "Software Engineer",
				Description: "Was responsible for all cart integration code, basically anything that sent Ordoro data out to an external eCommerce server. When a user scheduled a product import or shipment export, the code I managed day-to-day handled those tasks.",
				StartDate:   &ordoroStartDate,
				EndDate:     nil, // &ordoroEndDate,
			},
		},
		Education: education{
			StartDate: &schoolStartDate,
			EndDate:   &schoolEndDate,
			School:    "Alamo Community College",
			Major:     "Liberal Arts",
			Degree:    "Associate's",
		},
	}
	pn, _ := base64.StdEncoding.DecodeString(resume.BasicInfo.PhoneNumber)
	resume.BasicInfo.PhoneNumber = string(pn)

	email, _ := base64.StdEncoding.DecodeString(resume.BasicInfo.Email)
	resume.BasicInfo.Email = string(email)

	contentTypeInfo := req.Header["Content-type"]
	if len(contentTypeInfo) > 0 && contentTypeInfo[0] == "application/xml" {
		xml.NewEncoder(res).Encode(resume)
		return
	}
	json.NewEncoder(res).Encode(resume)
}

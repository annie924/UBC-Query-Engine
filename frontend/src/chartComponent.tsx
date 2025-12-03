// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

//With help from ChatGPT
import './App.css'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {Button} from "@/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {useState} from "react";

import { InteractiveChart, LineDataPoint } from "./lineChart.tsx";

type Section = {
	[key: string]: string | number;
}
import { InteractiveChart3, chartDataType3 } from "./barChart.tsx";
import {chartDataType2, InteractiveChart2} from "@/stackChart.tsx";



function ChartComponent() {
	const [nameShowA, setNameShowA] = useState("")
	const [nameShowCourse, setNameShowCourse] = useState("")
	const [nameShowNumber, setNameShowNumber] = useState("")
	const [lineData, setLineData] = useState<LineDataPoint[]>([]);

	const [nameShowB, setNameShowB] = useState("")
	const [nameShowInstructor, setNameShowInstructor] = useState("")
	const [barData, setBarData] = useState<chartDataType2[]>([]);


	const [nameShowC, setNameShowC] = useState("")
	const [nameShowDept, setNameShowDept] = useState("")
	const [selectedLevel, setSelectedLevel] = useState<string>("");
	const [nameShowYear, setNameShowYear] = useState("")
	const [chartData, setChartData] = useState<chartDataType3[]>([]);


	const [dialogMessage, setDialogMessage] = useState("")
	const [dialogOpen, setDialogOpen] = useState(false)
	const [dialogTitle, setDialogTitle] = useState("Error")
	const [showChartA, setShowChartA] = useState(false)
	const [showChartB, setShowChartB] = useState(false)
	const [showChartC, setShowChartC] = useState(false)


	const handleShowA = async () => {
		if (!nameShowA.trim() || !nameShowCourse.trim() || !nameShowNumber.trim()) {
			setDialogTitle("Error")
			setDialogMessage("Please fill out all fields.")
			setDialogOpen(true)
			return
		}

		try{
			const data = await fetchInsightA(nameShowA,nameShowCourse.trim(), nameShowNumber.trim());

			const transformedData = data.map((entry) => {
				const pass = entry[`${nameShowA}_pass`];
				const fail = entry[`${nameShowA}_fail`];
				const year = entry[`${nameShowA}_year`];
				return {
					label: year,
					passRate: Number(((pass / (pass + fail)) * 100).toFixed(2)),
				};
			});

			setLineData(transformedData);
			setShowChartB(false)
			setShowChartC(false)
			setShowChartA(true)
		} catch (err) {
			setDialogTitle("Query Error");
			setDialogMessage((err as Error).message);
			setDialogOpen(true);
		}

	}

	async function fetchInsightA(datasetId: string, dept: string, id: string): Promise<Section[]> {
		const failKey = `${datasetId}_fail`;
		const passKey = `${datasetId}_pass`;
		const courseKey = `${datasetId}_dept`;
		const idKey = `${datasetId}_id`;
		const yearKey = `${datasetId}_year`;

		const query = {
			WHERE: {
				AND: [
					{ IS: { [courseKey]: dept } },
					{ IS: { [idKey]: id } },
				],

			},
			OPTIONS: {
				COLUMNS: [courseKey, idKey, passKey, failKey, yearKey],
				ORDER: idKey
			}
		};


		const res = await fetch("http://localhost:4321/query", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(query)
		});

		if (!res.ok) {
			throw new Error("Query failed");
		}

		const data = await res.json();
		return data.result;

	}

	const handleShowB = async () => {
		if (!nameShowB.trim() || !nameShowInstructor.trim()) {
			setDialogTitle("Error")
			setDialogMessage("Please fill out all fields.")
			setDialogOpen(true)
			return
		}
		try{
			const data = await fetchInsightB(nameShowB,nameShowInstructor.trim());

			if (data.length === 0) {
				setDialogTitle("No Results Found");
				setDialogMessage(`No courses found for instructor "${nameShowInstructor.trim()}".`);
				setDialogOpen(true);
				return;
			}

			const transformedData = data.map((entry) => {
				const avg =  entry[`${nameShowB}_avg`];
				const dept = entry[`${nameShowB}_dept`];
				const id = entry[`${nameShowB}_id`];
				return {
					label: `${dept}${id}`,
					average: avg
				};
			});

			setBarData(transformedData);
			setShowChartB(true)
			setShowChartC(false)
			setShowChartA(false)
		} catch (err) {
			setDialogTitle("Query Error");
			setDialogMessage((err as Error).message);
			setDialogOpen(true);
		}

	}

	async function fetchInsightB(datasetId: string, instructor: string): Promise<Section[]> {
		const courseKey = `${datasetId}_dept`;
		const idKey = `${datasetId}_id`;
		const avgKey = `${datasetId}_avg`;
		const instructorKey = `${datasetId}_instructor`;

		const query = {
			WHERE: {
				IS: { [instructorKey]: instructor }
			},
			OPTIONS: {
				COLUMNS: [courseKey, idKey, avgKey,instructorKey],
				ORDER: courseKey
			}
		};


		const res = await fetch("http://localhost:4321/query", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(query)
		});

		if (!res.ok) {
			throw new Error("Query failed");
		}

		const data = await res.json();
		return data.result;

	}

	const handleShowC = async () => {
		if (!nameShowC.trim() || !nameShowDept.trim() || !selectedLevel || !nameShowYear.trim()) {
			setDialogTitle("Error");
			setDialogMessage("Please fill out all fields.");
			setDialogOpen(true);
			return;
		}

		if (isNaN(Number(nameShowYear.trim()))) {
			setDialogTitle("Error");
			setDialogMessage("Year must be a valid number.");
			setDialogOpen(true);
			return;
		}

		try {
			const data = await fetchInsightC(nameShowC,nameShowDept.trim(),Number(nameShowYear.trim()));

			const totals: Record<string, number> = {};

			for (const entry of data) {
				const id = entry[`${nameShowC}_id`];
				const pass = Number(entry[`${nameShowC}_pass`] || 0);
				const fail = Number(entry[`${nameShowC}_fail`] || 0);
				const audit = Number(entry[`${nameShowC}_audit`] || 0);
				const label = `${nameShowDept}${id}`;

				if (!totals[label]) totals[label] = 0;
				totals[label] += pass + fail + audit;
			}

			const transformedData = Object.entries(totals).map(([label, totalNumber]) => ({
				label,
				totalNumber,
			}));


			setChartData(transformedData);
			setShowChartA(false);
			setShowChartB(false);
			setShowChartC(true);
		} catch (error) {
			setDialogTitle("Error");
			setDialogMessage(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
			setDialogOpen(true);
		}
	};
	async function fetchInsightC(datasetId: string, dept: string,year:number): Promise<Section[]> {
		const failKey = `${datasetId}_fail`;
		const passKey = `${datasetId}_pass`;
		const auditKey = `${datasetId}_audit`;
		const courseKey = `${datasetId}_dept`;
		const idPrefix = selectedLevel.charAt(0);
		const idKey = `${datasetId}_id`;
		const yearKey = `${datasetId}_year`;

		const query = {
			WHERE: {
				AND: [
					{ IS: { [courseKey]: dept } },
					{ IS: { [idKey]: `${idPrefix}*` } },
					{ EQ: { [yearKey]: year } },
				],

			},
			OPTIONS: {
				COLUMNS: [idKey, failKey, passKey, auditKey, yearKey],
				ORDER: idKey
			}
		};


		const res = await fetch("http://localhost:4321/query", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(query)
		});

		if (!res.ok) {
			throw new Error("Query failed");
		}

		const data = await res.json();
		return data.result;

	}

	return (
	<div>
		  <div className="w-full flex justify-center gap-5">
			  <Card className="w-[400px] border hover:border-blue-500 transition-colors mt-10">
				  <CardHeader className={"text-left"}>
					  <CardTitle className={"text-xl"}>Pass/Fail</CardTitle>
					  {/*<CardDescription>Gain insights about the selected dataset</CardDescription>*/}
				  </CardHeader>
				  <CardContent>
					  <form>
						  <div className="grid w-full items-center gap-4">
							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="dataset">Dataset Name</Label>
								  <Input
									  id="dataset"
									  placeholder="Name of Dataset"
									  value={nameShowA} onChange={(e) => setNameShowA(e.target.value)}/>
							  </div>

							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="Department">Department</Label>
								  <Input
									  id="course"
									  placeholder="Name of Department"
									  value={nameShowCourse} onChange={(e) => setNameShowCourse(e.target.value)}/>
							  </div>

							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="course number">Course Number</Label>
								  <Input
									  id="course number"
									  placeholder="Course number"
									  value={nameShowNumber} onChange={(e) => setNameShowNumber(e.target.value)}/>
							  </div>
						  </div>
					  </form>
				  </CardContent>
				  <CardFooter className="flex justify-end">
					  <Button variant="outline" onClick={handleShowA}>Show</Button>
				  </CardFooter>
			  </Card>


			  <Card className="w-[400px] border hover:border-blue-500 transition-colors mt-10">
			  <CardHeader className={"text-left"}>
					  <CardTitle className={"text-xl"}>Instructor Course Average</CardTitle>
					  {/*<CardDescription>Gain insights about the selected dataset</CardDescription>*/}
				  </CardHeader>
				  <CardContent>
					  <form>
						  <div className="grid w-full items-center gap-4">
							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="name">Name</Label>
								  <Input
									  id="name"
									  placeholder="Name of your dataset"
									  value={nameShowB}
									  onChange={(e) => setNameShowB(e.target.value)}
								  />
							  </div>

							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="name">Instructor</Label>
								  <Input
									  id="name"
									  placeholder="Name of instructor"
									  value={nameShowInstructor}
									  onChange={(e) => setNameShowInstructor(e.target.value)}
								  />
							  </div>
						  </div>
					  </form>
				  </CardContent>
				  <CardFooter className="flex justify-end">
					  <Button variant="outline" onClick={handleShowB}>Show</Button>
				  </CardFooter>
			  </Card>


			  <Card className="w-[400px] border hover:border-blue-500 transition-colors mt-10">
				  <CardHeader className={"text-left"}>
					  <CardTitle className={"text-xl"}>Registered number of students</CardTitle>
				  </CardHeader>
				  <CardContent>
					  <form>
						  <div className="grid w-full items-center gap-4">
							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="name">Name</Label>
								  <Input
									  id="name"
									  placeholder="Name of your dataset"
									  value={nameShowC}
									  onChange={(e) => setNameShowC(e.target.value)}
								  />
							  </div>

							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="name">Department</Label>
								  <Input
									  id="name"
									  placeholder="Name of department"
									  value={nameShowDept}
									  onChange={(e) => setNameShowDept(e.target.value)}
								  />
							  </div>

							  <div className="flex flex-col space-y-1.5">
								  <Label htmlFor="name">Year</Label>
								  <Input
									  id="name"
									  placeholder="Year"
									  value={nameShowYear}
									  onChange={(e) => setNameShowYear(e.target.value)}
								  />
							  </div>

							  <div>
								  <Label htmlFor="name">Level</Label>

								  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
									  <SelectTrigger className="w-[180px]">
										  <SelectValue placeholder="Select a level"/>
									  </SelectTrigger>
									  <SelectContent>
										  <SelectGroup>
											  <SelectLabel>Level</SelectLabel>
											  <SelectItem value="1xx">1XX</SelectItem>
											  <SelectItem value="2xx">2XX</SelectItem>
											  <SelectItem value="3xx">3XX</SelectItem>
											  <SelectItem value="4xx">4XX</SelectItem>
										  </SelectGroup>
									  </SelectContent>
								  </Select>
							  </div>
						  </div>
					  </form>
				  </CardContent>
				  <CardFooter className="flex justify-end">
					  <Button variant="outline" onClick={handleShowC}>Show</Button>
				  </CardFooter>
			  </Card>


			  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				  <DialogContent>
					  <DialogHeader>
					  <DialogTitle>{dialogTitle}</DialogTitle>
					  </DialogHeader>
					  <p>{dialogMessage}</p>
				  </DialogContent>
			  </Dialog>
		  </div>

		{showChartA && (<InteractiveChart lineData={lineData}
										  courseName={nameShowCourse}
										  courseId={nameShowNumber}/>)}
		{showChartB && (<InteractiveChart2 barData={barData} instructorName={nameShowInstructor}/>)}
		{showChartC && (
			<InteractiveChart3
				chartData={chartData}
				nameShowDept={nameShowDept}
				selectedLevel={selectedLevel}
			/>
		)}
	</div>


	)
}

export default ChartComponent



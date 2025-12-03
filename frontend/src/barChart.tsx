"use client"
//with help from ChatGPT
import {Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis} from "recharts"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

export type chartDataType3 = {
	label: string
	totalNumber: number
};

export function InteractiveChart3({
									  chartData,
									  nameShowDept,
									  selectedLevel,
								  }: {
	chartData: chartDataType3[];
	nameShowDept: string;
	selectedLevel: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					Bar Chart - Registered Number of Students
				</CardTitle>
				<CardDescription>All the {selectedLevel.toUpperCase()} courses in department {nameShowDept}</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 35)}>
					<BarChart
						// accessibilityLayer
						data={chartData}
						layout="vertical"
						margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
					>
						<CartesianGrid horizontal={false} />
						<YAxis
							dataKey="label"
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
						/>
						<XAxis dataKey="totalNumber" type="number" hide />
						<Bar
							dataKey="totalNumber"
							fill="var(--color-Students)"
							radius={4}
						>
							<LabelList
								dataKey="totalNumber"
								position="right"
								offset={8}
								className="fill-foreground"
								fontSize={12}
							/>
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
			{/*<CardFooter className="flex-col items-start gap-2 text-sm">*/}
			{/*	<div className="flex gap-2 font-medium leading-none">*/}
			{/*		Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />*/}
			{/*	</div>*/}
			{/*	<div className="leading-none text-muted-foreground">*/}
			{/*		Showing total visitors for the last 6 months*/}
			{/*	</div>*/}
			{/*</CardFooter>*/}
		</Card>
	);
}

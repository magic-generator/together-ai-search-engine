import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
    let json = await req.json();
    
    try {
        const searchData = {
            q: json.question,
            // 可以添加其他搜索参数，如需要
        };

        // const response = await axios.request({
        //     method: 'post',
        //     url: 'https://google.serper.dev/search',
        //     headers: { 
        //         'X-API-KEY': process.env.SERPER_API_KEY || '', 
        //         'Content-Type': 'application/json'
        //     },
        //     data: searchData
        // });

        // // 确保我们从serper结果中提取所需数据
        // const searchResults = response.data.organic || [];
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 
                'X-API-KEY': process.env.SERPER_API_KEY || '', 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchData)
        });

        // 确保我们从serper结果中提取所需数据
        const resp = await response.json();
        const searchResults = resp.organic || [];
        // console.log(searchResults);
        
        return NextResponse.json(
            searchResults.map((result: any) => ({
                name: result.title,
                url: result.link,
                snippet: result.snippet,
            }))
        );
    } catch (error) {
        console.error("搜索API错误:", error);
        return NextResponse.json(
            { error: "获取搜索结果失败" },
            { status: 500 }
        );
    }
}
